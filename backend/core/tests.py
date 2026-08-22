from datetime import date
from django.test import SimpleTestCase
from .utils import parse_qr_line


class ParseQRLineTests(SimpleTestCase):

    # --- casos válidos ---

    def test_formato_completo(self):
        resultado = parse_qr_line("123456 2020NE800128 (UG:CPLT) NF4567 15/03/2023")
        self.assertEqual(resultado["codigo_tombamento"], "123456")
        self.assertEqual(resultado["empenho"], "2020NE800128")
        self.assertEqual(resultado["campus_origem"], "CPLT")
        self.assertEqual(resultado["nota_fiscal"], "4567")
        self.assertEqual(resultado["data_entrada"], date(2023, 3, 15))

    def test_ug_colado_ao_empenho(self):
        """Etiquetas reais às vezes não têm espaço antes do '(' — o parser deve corrigir."""
        resultado = parse_qr_line("123456 2020NE800128(UG:CPLT) NF4567 15/03/2023")
        self.assertEqual(resultado["campus_origem"], "CPLT")
        self.assertEqual(resultado["codigo_tombamento"], "123456")

    def test_sem_ug_e_sem_nf(self):
        resultado = parse_qr_line("789012 2021NE900200 20/07/2021")
        self.assertEqual(resultado["codigo_tombamento"], "789012")
        self.assertEqual(resultado["empenho"], "2021NE900200")
        self.assertIsNone(resultado["campus_origem"])
        self.assertIsNone(resultado["nota_fiscal"])
        self.assertEqual(resultado["data_entrada"], date(2021, 7, 20))

    def test_com_quebras_de_linha(self):
        """QR codes lidos por câmera podem trazer \\n entre os campos."""
        resultado = parse_qr_line("123456\n2020NE800128\n(UG:CPLT)\nNF4567\n15/03/2023")
        self.assertEqual(resultado["codigo_tombamento"], "123456")
        self.assertEqual(resultado["campus_origem"], "CPLT")

    def test_sem_data(self):
        resultado = parse_qr_line("111111 2019NE700100 (UG:IFBA)")
        self.assertIsNone(resultado["data_entrada"])

    # --- casos de falha ---

    def test_string_vazia_retorna_none(self):
        self.assertIsNone(parse_qr_line(""))

    def test_none_retorna_none(self):
        self.assertIsNone(parse_qr_line(None))

    def test_somente_um_token_retorna_none(self):
        self.assertIsNone(parse_qr_line("123456"))
