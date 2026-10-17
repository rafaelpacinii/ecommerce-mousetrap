"""Deterministic postcode fixture for the disposable browser-test stack only."""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json


class Postcode(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        value = {'cep': '01001-000', 'logradouro': 'Praça da Sé', 'bairro': 'Sé',
                 'localidade': 'São Paulo', 'uf': 'SP', 'ibge': '3550308'}
        if self.path != '/ws/01001000/json/':
            value = {'erro': True}
        self.wfile.write(json.dumps(value).encode())

    def log_message(self, *_):
        pass


HTTPServer(('0.0.0.0', 8090), Postcode).serve_forever()
