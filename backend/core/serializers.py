from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Ambiente,
    Sala,
    Item,
    TombamentoAnual,
    ItemTombado,
    Inventario,
    ItemInventariado
)
from .utils import parse_qr_line


# SALA
class SalaSerializer(serializers.ModelSerializer):
    ambiente_nome = serializers.SerializerMethodField()

    class Meta:
        model = Sala
        fields = "__all__"

    def get_ambiente_nome(self, obj):
        return obj.ambiente.nome if obj.ambiente else None

# AMBIENTE
class AmbienteSerializer(serializers.ModelSerializer):
    salas = SalaSerializer(many=True, read_only=True)

    class Meta:
        model = Ambiente
        fields = "__all__"

# ITEM (ESTADO ATUAL)
class ItemSerializer(serializers.ModelSerializer):
    sala_nome = serializers.SerializerMethodField()
    ambiente_nome = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = "__all__"

    def get_sala_nome(self, obj):
        return obj.sala_atual.nome if obj.sala_atual else None

    def get_ambiente_nome(self, obj):
        if obj.sala_atual and obj.sala_atual.ambiente:
            return obj.sala_atual.ambiente.nome
        return None


# LEITURA DE QR CODE (TOMBAMENTO)
class LeituraQRCodeSerializer(serializers.Serializer):
    qr_code = serializers.CharField()
    sala_id = serializers.IntegerField()

    def create(self, validated_data):
        qr_texto = validated_data["qr_code"]
        sala_id = validated_data["sala_id"]

        dados = parse_qr_line(qr_texto)

        if not dados or not dados.get("codigo_tombamento"):
            raise serializers.ValidationError(
                {"qr_code": "QR Code inválido ou fora do padrão esperado."}
            )

        sala = Sala.objects.filter(id=sala_id).first()
        if not sala:
            raise serializers.ValidationError(
                {"sala_id": "Sala informada não existe."}
            )

        codigo = dados["codigo_tombamento"]

        item_existente = Item.objects.filter(
            codigo_tombamento=codigo
        ).select_related("sala_atual").first()

        if item_existente:
            if item_existente.sala_atual:
                raise serializers.ValidationError({
                    "item": "Item já cadastrado",
                    "sala_oficial": item_existente.sala_atual.nome,
                    "item_id": item_existente.id
                })

            item_existente.sala_atual = sala
            item_existente.save(update_fields=["sala_atual"])
            return item_existente

        return Item.objects.create(
            codigo_tombamento=codigo,
            nome=dados.get("nome"),
            empenho=dados.get("empenho"),
            campus_origem=dados.get("campus_origem"),
            nota_fiscal=dados.get("nota_fiscal"),
            data_entrada=dados.get("data_entrada"),
            sala_atual=sala,
        )

# ITEM TOMBADO
class ItemTombadoSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    sala_encontrada_nome = serializers.SerializerMethodField()

    class Meta:
        model = ItemTombado
        fields = "__all__"

    def get_sala_encontrada_nome(self, obj):
        return obj.sala_encontrada.nome if obj.sala_encontrada else None


# TOMBAMENTO ANUAL
class TombamentoAnualSerializer(serializers.ModelSerializer):
    total_itens = serializers.SerializerMethodField()

    class Meta:
        model = TombamentoAnual
        fields = "__all__"

    def get_total_itens(self, obj):
        return obj.itens.count()

# INVENTÁRIO
class InventarioSerializer(serializers.ModelSerializer):
    total_itens = serializers.SerializerMethodField()

    class Meta:
        model = Inventario
        fields = "__all__"

    def get_total_itens(self, obj):
        return obj.itens.count()


# USUÁRIO
User = get_user_model()

class UsuarioBasicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]

# ITEM INVENTARIADO
class ItemInventariadoSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    sala_oficial_nome = serializers.SerializerMethodField()
    sala_encontrada_nome = serializers.SerializerMethodField()
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True
    )
    registrado_por = UsuarioBasicoSerializer(read_only=True)
    resolvido_por = UsuarioBasicoSerializer(read_only=True)
    
    class Meta:
        model = ItemInventariado
        fields = "__all__"

    def get_sala_oficial_nome(self, obj):
        return (
            obj.item.sala_atual.nome
            if obj.item and obj.item.sala_atual 
            else None
        )
    def get_sala_encontrada_nome(self, obj):
        return obj.sala_encontrada.nome if obj.sala_encontrada else None
