from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from .models import (
    TombamentoAnual,
    ItemTombado,
    Inventario,
    ItemInventariado
)

# RELATÓRIO DE TOMBAMENTO
class RelatorioTombamentoViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        GET /api/relatorios/tombamentos/
        Lista os anos disponíveis
        """
        anos = (
            TombamentoAnual.objects
            .order_by("-ano")
            .values_list("ano", flat=True)
        )
        return Response(list(anos))

    def retrieve(self, request, pk=None):
        """
        GET /api/relatorios/tombamentos/{ano}/
        Retorna relatório estruturado (JSON)
        """
        dados = self._montar_relatorio(pk)

        if not dados:
            return Response(
                {"erro": "Tombamento não encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(dados)

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        """
        GET /api/relatorios/tombamentos/{ano}/pdf/
        Gera PDF
        """
        dados = self._montar_relatorio(pk)

        if not dados:
            return Response(
                {"erro": "Tombamento não encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        html = render_to_string(
            "relatorio_tombamento.html",
            {
                "ano": dados["ano"],
                "ambientes": dados["ambientes"],
                "data_geracao": timezone.localtime(timezone.now()).strftime("%d/%m/%Y %H:%M"),
            }
        )

        from weasyprint import HTML

        pdf = HTML(
            string=html,
            base_url=request._request.build_absolute_uri("/")
        ).write_pdf()

        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="relatorio_tombamento_{dados["ano"]}.pdf"'
        )
        return response

    # FUNÇÃO INTERNA
    def _montar_relatorio(self, ano):
        try:
            ano = int(ano)
        except (TypeError, ValueError):
            return None

        tombamento = TombamentoAnual.objects.filter(ano=ano).first()
        if not tombamento:
            return None

        leituras = (
            ItemTombado.objects
            .filter(tombamento=tombamento)
            .select_related(
                "item",
                "item__sala_atual",
                "item__sala_atual__ambiente",
                "sala_encontrada"
            )
        )

        ambientes_dict = {}

        for leitura in leituras:
            item = leitura.item
            sala = item.sala_atual
            ambiente = sala.ambiente if sala else None

            if not ambiente:
                continue

            ambientes_dict.setdefault(ambiente.id, {
                "id": ambiente.id,
                "nome": ambiente.nome,
                "salas": {}
            })

            ambientes_dict[ambiente.id]["salas"].setdefault(sala.id, {
                "id": sala.id,
                "nome": sala.nome,
                "itens": []
            })

            ambientes_dict[ambiente.id]["salas"][sala.id]["itens"].append({
                "codigo_tombamento": item.codigo_tombamento,
                "nome": item.nome,
                "empenho": item.empenho,
                "campus_origem": item.campus_origem,
                "nota_fiscal": item.nota_fiscal,
                "data_entrada": item.data_entrada,
                "sala_original": (
                    leitura.sala_encontrada.nome
                    if leitura.sala_encontrada else None
                ),
                "movido": leitura.movido
            })

        ambientes = []
        for ambiente in ambientes_dict.values():
            ambiente["salas"] = list(ambiente["salas"].values())
            ambientes.append(ambiente)

        return {
            "ano": ano,
            "ambientes": ambientes
        }

# RELATÓRIO DE INVENTÁRIO
class RelatorioInventarioViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        GET /api/relatorios/inventarios/
        Lista inventários existentes
        """
        inventarios = Inventario.objects.order_by("-criado_em")

        data = [
            {
                "id": inv.id,
                "nome": inv.nome,
                "criado_em": inv.criado_em,
                "encerrado": inv.encerrado,
            }
            for inv in inventarios
        ]

        return Response(data)

    def retrieve(self, request, pk=None):
        """
        GET /api/relatorios/inventarios/{id}/
        Relatório estruturado do inventário
        """
        inventario = Inventario.objects.filter(id=pk).first()
        if not inventario:
            return Response(
                {"erro": "Inventário não encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

        itens = (
            ItemInventariado.objects
            .filter(inventario=inventario)
            .select_related(
                "item",
                "item__sala_atual",
                "sala_encontrada"
            )
        )

        itens_data = []
        for leitura in itens:
            itens_data.append({
                "codigo_tombamento": leitura.item.codigo_tombamento,
                "nome": leitura.item.nome,
                "status": leitura.status,
                "sala_atual": (
                    leitura.item.sala_atual.nome
                    if leitura.item.sala_atual else None
                ),
                "sala_encontrada": (
                    leitura.sala_encontrada.nome
                    if leitura.sala_encontrada else None
                ),
                "ajustado": leitura.resolvido_em is not None,
            })

        return Response({
            "id": inventario.id,
            "nome": inventario.nome,
            "descricao": inventario.descricao,
            "encerrado": inventario.encerrado,
            "itens": itens_data
        })
