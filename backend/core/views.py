from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    Ambiente,
    Sala,
    Item,
    TombamentoAnual,
    ItemTombado,
    Inventario,
    ItemInventariado
)

from .serializers import (
    AmbienteSerializer,
    SalaSerializer,
    ItemSerializer,
    TombamentoAnualSerializer,
    ItemTombadoSerializer,
    InventarioSerializer,
    ItemInventariadoSerializer,
    LeituraQRCodeSerializer
)

# AMBIENTES
class AmbienteViewSet(viewsets.ModelViewSet):
    queryset = Ambiente.objects.all()
    serializer_class = AmbienteSerializer
    permission_classes = [IsAuthenticated]

# SALAS
class SalaViewSet(viewsets.ModelViewSet):
    queryset = Sala.objects.all()
    serializer_class = SalaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        ambiente_id = self.request.query_params.get("ambiente")
        if ambiente_id:
            qs = qs.filter(ambiente_id=ambiente_id)
        return qs

# ITENS
class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Item.objects.all()
        sala_id = self.request.query_params.get("sala_atual")
        if sala_id:
            qs = qs.filter(sala_atual_id=sala_id)
        return qs
    
    def destroy(self, request, *args, **kwargs):
        item = self.get_object()

        with transaction.atomic():
            ItemTombado.objects.filter(item=item).delete()
            ItemInventariado.objects.filter(item=item).delete()
            item.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def mover(self, request, pk=None):
        item = self.get_object()
        nova_sala_id = request.data.get("nova_sala")

        if not nova_sala_id:
            return Response({"erro": "nova_sala é obrigatória"}, status=400)

        nova_sala = get_object_or_404(Sala, id=nova_sala_id)
        item.sala_atual = nova_sala
        item.save(update_fields=["sala_atual"])

        return Response(ItemSerializer(item).data)

# TOMBAMENTO ANUAL
class TombamentoAnualViewSet(viewsets.ModelViewSet):
    queryset = TombamentoAnual.objects.all()
    serializer_class = TombamentoAnualSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"])
    def iniciar(self, request):
        ano = timezone.now().year

        tombamento, criado = TombamentoAnual.objects.get_or_create(
            ano=ano,
            defaults={"ativo": True}
        )

        return Response({
            "tombamento_id": tombamento.id,
            "ano": tombamento.ano,
            "ja_existia": not criado
        })

    # ESCANEAR (TOMBAMENTO)
    @action(detail=True, methods=["post"])
    def escanear(self, request, pk=None):
        from .utils import parse_qr_line

        tombamento = self.get_object()

        qr_text = request.data.get("qr_text")
        sala_id = request.data.get("sala_encontrada")

        if not qr_text or not sala_id:
            return Response(
                {"erro": "qr_text e sala_encontrada são obrigatórios"},
                status=status.HTTP_400_BAD_REQUEST
            )

        dados = parse_qr_line(qr_text)
        if not dados or not dados.get("codigo_tombamento"):
            return Response(
                {"erro": "QR Code inválido ou fora do padrão esperado."},
                status=status.HTTP_400_BAD_REQUEST
            )

        sala_lida = get_object_or_404(Sala, id=sala_id)

        with transaction.atomic():
            # Cadastra o item na primeira leitura; reaproveita se já existir.
            item, item_criado = Item.objects.get_or_create(
                codigo_tombamento=dados["codigo_tombamento"],
                defaults={
                    "empenho": dados.get("empenho") or "",
                    "campus_origem": dados.get("campus_origem") or "",
                    "nota_fiscal": dados.get("nota_fiscal") or "",
                    "data_entrada": dados.get("data_entrada"),
                    "sala_atual": sala_lida,
                },
            )

            # Item já existia mas sem sala oficial → adota a sala lida.
            if not item_criado and item.sala_atual is None:
                item.sala_atual = sala_lida
                item.save(update_fields=["sala_atual"])

            leitura, criada = ItemTombado.objects.get_or_create(
                tombamento=tombamento,
                item=item,
                defaults={"sala_encontrada": sala_lida}
            )

            # Já registrado nesse tombamento
            if not criada:
                # mesma sala
                if leitura.sala_encontrada_id == sala_lida.id:
                    return Response({
                        "status": "ja_registrado_na_sala",
                        "item": ItemSerializer(item).data
                    })

                # outra sala → NÃO atualiza automaticamente
                return Response({
                    "status": "ja_registrado_outra_sala",
                    "item": ItemSerializer(item).data,
                    "sala_encontrada": leitura.sala_encontrada.nome
                })

            # item oficial é de outra sala
            if not item_criado and item.sala_atual and item.sala_atual_id != sala_lida.id:
                return Response({
                    "status": "pertence_outra_sala",
                    "item": ItemSerializer(item).data,
                    "sala_oficial": item.sala_atual.nome,
                    "pode_mover": True
                })

        return Response({
            "status": "ok",
            "item": ItemSerializer(item).data,
            "novo_item": item_criado
        })


# INVENTÁRIO
class InventarioViewSet(viewsets.ModelViewSet):
    queryset = Inventario.objects.all().order_by("-criado_em")
    serializer_class = InventarioSerializer
    permission_classes = [IsAuthenticated]

    # CRIAR INVENTÁRIO
    def perform_create(self, serializer):
        with transaction.atomic():
            inventario = serializer.save()

            itens = Item.objects.all()
            ItemInventariado.objects.bulk_create([
                ItemInventariado(
                    inventario=inventario,
                    item=item,
                    status=ItemInventariado.STATUS_NAO
                )
                for item in itens
            ])

    # ESCANEAR ITEM
    @action(detail=True, methods=["post"])
    def escanear(self, request, pk=None):
        inventario = self.get_object()

        if inventario.encerrado:
            return Response(
                {"erro": "Inventário encerrado"},
                status=status.HTTP_400_BAD_REQUEST
            )

        qr_text = request.data.get("qr_text")
        sala_id = request.data.get("sala_encontrada")

        if not qr_text or not sala_id:
            return Response(
                {"erro": "qr_text e sala_encontrada são obrigatórios"},
                status=status.HTTP_400_BAD_REQUEST
            )

        from .utils import parse_qr_line
        dados = parse_qr_line(qr_text)

        if not dados or not dados.get("codigo_tombamento"):
            return Response(
                {"erro": "QR Code inválido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        item = get_object_or_404(
            Item,
            codigo_tombamento=dados["codigo_tombamento"]
        )

        sala = get_object_or_404(Sala, id=sala_id)

        with transaction.atomic():
            registro, _ = ItemInventariado.objects.select_for_update().get_or_create(
                inventario=inventario,
                item=item,
                defaults={"status": ItemInventariado.STATUS_NAO}
            )

            if registro.status != ItemInventariado.STATUS_NAO:
                return Response({
                    "status": "ja_verificado",
                    "item": ItemSerializer(item).data
                })

            registro.sala_encontrada = sala
            registro.status = (
                ItemInventariado.STATUS_OK if item.sala_atual_id == sala.id
                else ItemInventariado.STATUS_FORA
            )

            registro.registrado_por = request.user

            registro.save(update_fields=["status", "sala_encontrada", "registrado_por"])

        return Response({
            "status": registro.status,
            "item": ItemSerializer(item).data
        })

    # RESOLVER ITEM FORA DO LUGAR
    @action(detail=True, methods=["post"])
    def resolver_item(self, request, pk=None):
        inventario = self.get_object()

        item_id = request.data.get("item_id")
        acao = request.data.get("acao")  # manter_encontrada | voltar_oficial

        if not item_id or not acao:
            return Response(
                {"erro": "item_id e acao são obrigatórios"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            registro = get_object_or_404(
                ItemInventariado.objects.select_for_update(),
                inventario=inventario,
                item_id=item_id
            )

            if registro.status != ItemInventariado.STATUS_FORA:
                return Response(
                    {"erro": "Item não está fora do lugar"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if acao == "manter_encontrada":
                registro.item.sala_atual = registro.sala_encontrada
                registro.item.save(update_fields=["sala_atual"])
                registro.status = ItemInventariado.STATUS_MOVIDO

            elif acao == "voltar_oficial":
                registro.status = ItemInventariado.STATUS_MANTIDO_OFICIAL

            else:
                return Response(
                    {"erro": "Ação inválida"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            registro.resolvido_por = request.user
            registro.resolvido_em = timezone.now()
            
            
            registro.save(update_fields=["status", "resolvido_por", "resolvido_em"])

        return Response({
            "item_id": item_id,
            "status": registro.status
        })

    # RELATÓRIO
    @action(detail=True, methods=["get"])
    def relatorio(self, request, pk=None):
        inventario = self.get_object()

        itens = ItemInventariado.objects.filter(
            inventario=inventario
        ).select_related(
            "item",
            "sala_encontrada",
            "item__sala_atual",
            "registrado_por",
            "resolvido_por"
        )

        return Response({
            "inventario": InventarioSerializer(inventario).data,
            "resumo": {
                "total": itens.count(),
                "ok": itens.filter(status=ItemInventariado.STATUS_OK).count(),
                "fora_do_lugar": itens.filter(status=ItemInventariado.STATUS_FORA).count(),
                "nao_encontrados": itens.filter(status=ItemInventariado.STATUS_NAO).count(),
            },
            "itens": ItemInventariadoSerializer(itens, many=True).data
        })

# CONSULTAS
class ItemTombadoViewSet(viewsets.ModelViewSet):
    queryset = ItemTombado.objects.all()
    serializer_class = ItemTombadoSerializer
    permission_classes = [IsAuthenticated]


class ItemInventariadoViewSet(viewsets.ModelViewSet):
    queryset = ItemInventariado.objects.all()
    serializer_class = ItemInventariadoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(registrado_por=self.request.user)