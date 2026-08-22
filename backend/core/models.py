from django.db import models
from django.db.models import Q
from django.conf import settings

# AMBIENTE
class Ambiente(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome

# SALA
class Sala(models.Model):
    nome = models.CharField(max_length=100)
    ambiente = models.ForeignKey(
        Ambiente,
        on_delete=models.CASCADE,
        related_name="salas"
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("nome", "ambiente")

    def __str__(self):
        return f"{self.nome} ({self.ambiente.nome})"

# ITEM (ESTADO ATUAL / CADASTRO OFICIAL)
class Item(models.Model):
    codigo_tombamento = models.CharField(
        max_length=30,
        unique=True,
        db_index=True
    )

    nome = models.CharField(max_length=150, blank=True)
    empenho = models.CharField(max_length=50, blank=True)
    campus_origem = models.CharField(max_length=50, blank=True)
    nota_fiscal = models.CharField(max_length=30, blank=True)
    data_entrada = models.DateField(null=True, blank=True)

    sala_atual = models.ForeignKey(
        Sala,
        on_delete=models.PROTECT,  
        null=True,
        blank=True,
        related_name="itens"
    )

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.codigo_tombamento

# TOMBAMENTO ANUAL
class TombamentoAnual(models.Model):
    ano = models.PositiveIntegerField(unique=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Tombamento {self.ano}"

# ITEM TOMBADO (HISTÓRICO)
class ItemTombado(models.Model):
    tombamento = models.ForeignKey(
        TombamentoAnual,
        on_delete=models.CASCADE,
        related_name="itens"
    )

    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name="leituras_tombamento"
    )

    sala_encontrada = models.ForeignKey(
        Sala,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    movido = models.BooleanField(default=False)
    lido_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["item", "tombamento"],
                name="unique_item_por_tombamento"
            )
        ]

    def __str__(self):
        return f"{self.item.codigo_tombamento} - {self.tombamento.ano}"

# INVENTÁRIO
class Inventario(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    encerrado = models.BooleanField(default=False)

    def __str__(self):
        return self.nome

# ITEM INVENTARIADO
class ItemInventariado(models.Model):
    STATUS_OK = "ok"
    STATUS_FORA = "fora_do_lugar"
    STATUS_MOVIDO = "movido"
    STATUS_MANTIDO_OFICIAL = "mantido_oficial"
    STATUS_NAO = "nao_encontrado"

    STATUS_CHOICES = (
        (STATUS_OK, "Correto"),
        (STATUS_FORA, "Fora do lugar"),
        (STATUS_MOVIDO, "Movido para sala encontrada"),
        (STATUS_MANTIDO_OFICIAL, "Mantido na sala origem"),
        (STATUS_NAO, "Não encontrado"),
    )

    inventario = models.ForeignKey(
        Inventario,
        on_delete=models.CASCADE,
        related_name="itens"
    )

    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name="leituras_inventario"
    )

    sala_encontrada = models.ForeignKey(
        Sala,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_NAO
    )
    
    # Quem escaneou
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leituras_registradas"
    )
    
    registrado_em = models.DateTimeField(auto_now_add=True)
    
    
    # Quem resolveu
    resolvido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leituras_resolvidas"
    )
    
    resolvido_em = models.DateTimeField(
        null=True,
        blank=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["inventario", "item"],
                name="unique_item_por_inventario"
            )
        ]

    def __str__(self):
        return f"{self.item.codigo_tombamento} - {self.inventario.nome}"
