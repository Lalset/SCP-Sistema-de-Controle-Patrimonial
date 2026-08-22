from django.contrib import admin
from .models import (
    Ambiente, Sala, Item,
    TombamentoAnual, ItemTombado,
    Inventario, ItemInventariado,
)


@admin.register(Ambiente)
class AmbienteAdmin(admin.ModelAdmin):
    list_display = ("nome", "criado_em")
    search_fields = ("nome",)


@admin.register(Sala)
class SalaAdmin(admin.ModelAdmin):
    list_display = ("nome", "ambiente", "criado_em")
    search_fields = ("nome", "ambiente__nome")
    list_filter = ("ambiente",)


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ("codigo_tombamento", "nome", "sala_atual", "empenho", "campus_origem", "data_entrada")
    search_fields = ("codigo_tombamento", "nome", "empenho", "nota_fiscal")
    list_filter = ("sala_atual__ambiente", "campus_origem")


@admin.register(TombamentoAnual)
class TombamentoAnualAdmin(admin.ModelAdmin):
    list_display = ("ano", "ativo", "criado_em")
    list_filter = ("ativo",)


@admin.register(ItemTombado)
class ItemTombadoAdmin(admin.ModelAdmin):
    list_display = ("item", "tombamento", "sala_encontrada", "movido", "lido_em")
    search_fields = ("item__codigo_tombamento",)
    list_filter = ("tombamento", "movido")


@admin.register(Inventario)
class InventarioAdmin(admin.ModelAdmin):
    list_display = ("nome", "encerrado", "criado_em")
    list_filter = ("encerrado",)
    search_fields = ("nome",)


@admin.register(ItemInventariado)
class ItemInventariadoAdmin(admin.ModelAdmin):
    list_display = ("item", "inventario", "status", "registrado_por", "registrado_em", "resolvido_por", "resolvido_em")
    search_fields = ("item__codigo_tombamento",)
    list_filter = ("inventario", "status")
