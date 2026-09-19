#!/bin/bash
# Gera um certificado autoassinado pra rodar em HTTPS na EC2, usando o IP
# público atual da instância. Lembrar rodar esse script DENTRO da EC2, na raiz do
# projeto, sempre que o IP público mudar (ele muda quando a instância para
# e é ligada de novo, a menos que você tenha um Elastic IP fixo).
set -e

# A AWS exige um token (IMDSv2) pra consultar os metadados da instância.
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/public-ipv4)

if [ -z "$IP" ]; then
  echo "Não consegui detectar o IP público automaticamente."
  echo "Rode manualmente: openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -subj \"/CN=SEU_IP\" -addext \"subjectAltName=IP:SEU_IP\""
  exit 1
fi

mkdir -p certs

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/key.pem -out certs/cert.pem \
  -subj "/CN=$IP" \
  -addext "subjectAltName=IP:$IP"

echo ""
echo "Certificado gerado para o IP: $IP"
echo "Confere se o seu .env tem:"
echo "  ALLOWED_HOSTS=$IP"
echo "  CORS_ALLOWED_ORIGINS=https://$IP"
echo "  CSRF_TRUSTED_ORIGINS=https://$IP"
