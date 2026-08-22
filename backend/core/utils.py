import re
from datetime import datetime

QR_PATTERNS = [
    re.compile(
        r'^\s*(?P<numero>\d+)\s+'
        r'(?P<empenho>\S+)\s+'
        r'(?:\(?\s*UG\s*:\s*(?P<campus>[^\)\s]+)\s*\)?\s+)?'
        r'(?:NF(?P<nota>[\w\-]+))?\s*'
        r'(?P<data>\d{1,2}/\d{1,2}/\d{4})?\s*$',
        re.IGNORECASE
    ),
    re.compile(
        r'^\s*(?P<numero>\d+)\s+'
        r'(?P<empenho>\S+)\s+'
        r'(?:NF(?P<nota>[\w\-]+))?\s*'
        r'(?P<data>\d{1,2}/\d{1,2}/\d{4})?\s*$',
        re.IGNORECASE
    ),
]


import re
from datetime import datetime


def parse_qr_line(texto):
    if not texto:
        return None

    # Normaliza espaços e quebras de linha
    texto = texto.replace("\n", " ").replace("\r", " ")
    texto = re.sub(r"\s+", " ", texto).strip()

    # Insere espaço antes de '(' caso esteja colado ao token anterior
    # Ex: "2020NE800128(UG:CPLT)" → "2020NE800128 (UG:CPLT)"
    texto = re.sub(r'(?<=\S)\(', ' (', texto)

    # Agora normaliza espaços novamente após a substituição
    texto = re.sub(r"\s+", " ", texto).strip()

    partes = texto.split(" ")

    # Mínimo esperado: número + empenho + data (3 partes)
    if len(partes) < 2:
        return None

    codigo_tombamento = partes[0]
    empenho = partes[1]

    # Extrai campus do UG (com ou sem espaço após ':')
    campus_origem = None
    ug_match = re.search(r'\(UG\s*:\s*([^\)\s]+)\)', texto, re.IGNORECASE)
    if ug_match:
        campus_origem = ug_match.group(1).strip()

    # Extrai nota fiscal — NF pode estar colado ou separado
    nota_fiscal = None
    nf_match = re.search(r'NF([\w\-]+)', texto, re.IGNORECASE)
    if nf_match:
        nota_fiscal = nf_match.group(1)

    # Extrai data — sempre o último token no formato dd/mm/yyyy
    data_entrada = None
    data_match = re.search(r'\b(\d{1,2}/\d{1,2}/\d{4})\b', texto)
    if data_match:
        try:
            data_entrada = datetime.strptime(data_match.group(1), "%d/%m/%Y").date()
        except ValueError:
            pass

    return {
        "codigo_tombamento": codigo_tombamento,
        "empenho": empenho,
        "campus_origem": campus_origem,
        "nota_fiscal": nota_fiscal,
        "data_entrada": data_entrada,
    }