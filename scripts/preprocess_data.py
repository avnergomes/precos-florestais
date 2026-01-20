# -*- coding: utf-8 -*-
"""
Preprocessamento dos dados de Precos Florestais - DERAL/SEAB Parana
Consolida todos os arquivos Excel em formato JSON para o dashboard

Versao 2025 - Mapeamento integrado e padronizado
"""

import pandas as pd
import numpy as np
import json
import re
import unicodedata
from pathlib import Path

try:
    import pdfplumber
except Exception:
    pdfplumber = None

BASE_DIR = Path("E:/Preços Florestais")
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "dashboard" / "public" / "data"

# =============================================================================
# REGIOES PADRONIZADAS
# =============================================================================
REGIOES = [
    'Apucarana', 'Campo Mourao', 'Cascavel', 'Cianorte', 'Cornelio Procopio',
    'Curitiba', 'Francisco Beltrao', 'Guarapuava', 'Irati', 'Ivaipora',
    'Jacarezinho', 'Laranjeiras', 'Londrina', 'Maringa', 'Paranagua',
    'Paranavai', 'Pato Branco', 'Pitanga', 'Ponta Grossa', 'Toledo',
    'Umuarama', 'Uniao da Vitoria'
]

REGION_KEY_MAP = {
    'APUCARANA': 'Apucarana',
    'CAMPOMOURAO': 'Campo Mourao',
    'CMOURAO': 'Campo Mourao',
    'CASCAVEL': 'Cascavel',
    'CIANORTE': 'Cianorte',
    'CORNELIOPROCOPIO': 'Cornelio Procopio',
    'CPROCOPIO': 'Cornelio Procopio',
    'CURITIBA': 'Curitiba',
    'FRANCISCOBELTRAO': 'Francisco Beltrao',
    'FBELTRAO': 'Francisco Beltrao',
    'GUARAPUAVA': 'Guarapuava',
    'IRATI': 'Irati',
    'IVAIPORA': 'Ivaipora',
    'JACAREZINHO': 'Jacarezinho',
    'LARANJEIRAS': 'Laranjeiras',
    'LARANJEIRASDOSUL': 'Laranjeiras',
    'LONDRINA': 'Londrina',
    'MARINGA': 'Maringa',
    'PARANAGUA': 'Paranagua',
    'PARANAVAI': 'Paranavai',
    'PATOBRANCO': 'Pato Branco',
    'PBRANCO': 'Pato Branco',
    'PITANGA': 'Pitanga',
    'PONTAGROSSA': 'Ponta Grossa',
    'PGROSSA': 'Ponta Grossa',
    'TOLEDO': 'Toledo',
    'UMUARAMA': 'Umuarama',
    'UNIAODAVITORIA': 'Uniao da Vitoria',
    'UVITORIA': 'Uniao da Vitoria'
}

# =============================================================================
# CATEGORIAS, SUBCATEGORIAS E PRODUTOS PADRONIZADOS 2025
# =============================================================================

# Categorias padronizadas (title case, sem acentos para consistencia interna)
CATEGORIAS_PADRAO = {
    'Mudas': {
        'Araucaria': ['Araucaria'],
        'Bracatinga': ['Bracatinga', 'Bracatinga Argentina'],
        'Erva-mate': ['Erva-mate'],
        'Eucalipto Clonal': ['Eucalipto Clonal'],
        'Eucalipto Seminal': [
            'Eucalyptus benthamii',
            'Eucalyptus camaldulensis',
            'Eucalyptus citriodora',
            'Eucalyptus dunnii',
            'Eucalyptus grandis',
            'Eucalyptus saligna',
            'Eucalyptus viminalis',
            'Eucalyptus urophylla'
        ],
        'Nativas': [
            'Angico', 'Aroeira', 'Canafistula', 'Canela', 'Caroba',
            'Cassia', 'Cedro', 'Extremosa', 'Flamboyant', 'Imbuia',
            'Ipe', 'Jacaranda', 'Manduirana', 'Paineira', 'Peroba',
            'Tipuana', 'Grevilha', 'Mogno', 'Cerejeira', 'Nativas Diversas'
        ],
        'Palmito': ['Palmito Jucara', 'Palmito Pupunha'],
        'Pinus Seminal': [
            'Pinus elliottii',
            'Pinus taeda',
            'Pinus tropicais'
        ]
    },
    'Sementes': {
        'Eucalipto': [
            'Sementes Eucalyptus dunnii',
            'Sementes Eucalyptus grandis',
            'Sementes Eucalyptus saligna',
            'Sementes Eucalyptus viminalis'
        ],
        'Pinus': ['Sementes Pinus'],
        'Araucaria': ['Sementes Araucaria']
    },
    'Toras': {
        'Araucaria': ['Toras Araucaria'],
        'Eucalipto': [
            'Toras Eucalipto < 14 cm',
            'Toras Eucalipto 14-18 cm',
            'Toras Eucalipto 18-25 cm',
            'Toras Eucalipto 25-35 cm',
            'Toras Eucalipto > 35 cm',
            'Toras Eucalipto Geral',
            'Toras Eucalipto Media Estado'
        ],
        'Pinus': [
            'Toras Pinus < 14 cm',
            'Toras Pinus 14-18 cm',
            'Toras Pinus 18-25 cm',
            'Toras Pinus 25-35 cm',
            'Toras Pinus > 35 cm',
            'Toras Pinus Geral',
            'Toras Pinus Media Estado'
        ],
        'Nativas': [
            'Toras Canela', 'Toras Cedro', 'Toras Cerejeira',
            'Toras Grevilha', 'Toras Imbuia', 'Toras Mogno',
            'Toras Angico', 'Toras Peroba', 'Toras Alamo',
            'Toras Madeira de Lei', 'Toras Outras Especies'
        ],
        'Processo': ['Toras Processo', 'Escoras']
    },
    'Energia': {
        'Lenha': ['Lenha'],
        'Carvao': ['Carvao Vegetal']
    },
    'Cavacos': {
        'Limpo': ['Cavaco Limpo'],
        'Sujo': ['Cavaco Sujo']
    },
    'PFNM': {
        'Erva-mate Folha': [
            'Erva-mate Folha Pe',
            'Erva-mate Folha Industria',
            'Erva-mate Folha Barranco'
        ],
        'Palmito': ['Palmito Cabeca'],
        'Latex': ['Latex Seringueira'],
        'Pinhao': ['Pinhao'],
        'Resina': ['Resina Pinus']
    },
    'Produtos Beneficiados': {
        'Erva-mate': [
            'Erva-mate Cancheada',
            'Erva-mate Beneficiada',
            'Erva-mate Industrial',
            'Erva-mate Mercado'
        ]
    },
    'Custos Operacionais': {
        'Colheita': ['Custos Colheita e Carregamento']
    },
    'Madeira Serrada': {
        'Pinus': ['Madeira Serrada Pinus'],
        'Eucalipto': ['Madeira Serrada Eucalipto'],
        'Araucaria': ['Madeira Serrada Araucaria'],
        'Nativas': [
            'Madeira Serrada Cedro', 'Madeira Serrada Imbuia',
            'Madeira Serrada Cerejeira', 'Madeira Serrada Mogno',
            'Madeira Serrada Grevilha'
        ]
    },
    'Residuos': {
        'Geral': ['Costaneiras', 'Destopo', 'Refilo', 'Serragem']
    }
}


# =============================================================================
# MAPEAMENTO DE PRODUTOS - INFALIVEL E COMPLETO
# O mapeamento usa chaves normalizadas (sem acentos, uppercase, sem espacos)
# =============================================================================

def normalize_key(text):
    """Normaliza texto para chave de comparacao"""
    if pd.isna(text):
        return ''
    text = str(text)
    text = unicodedata.normalize('NFD', text)
    text = ''.join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r'[^A-Za-z0-9]+', '', text)
    return text.upper()


# Mapeamento completo: (categoria, subcategoria, produto, unidade)
# Cada entrada mapeia um padrao normalizado para os valores padronizados
PRODUCT_MAPPING = {}

def _add_mapping(patterns, categoria, subcategoria, produto, unidade=None):
    """Adiciona mapeamento para lista de padroes"""
    if isinstance(patterns, str):
        patterns = [patterns]
    for p in patterns:
        key = normalize_key(p)
        if key:
            PRODUCT_MAPPING[key] = (categoria, subcategoria, produto, unidade)


# -----------------------------------------------------------------------------
# MUDAS DE ARAUCARIA
# -----------------------------------------------------------------------------
_add_mapping([
    'Araucaria', 'ARAUCARIA', 'ARAUCARIA - Angustifolia',
    'Araucaria - Araucaria angustifolia', 'Araucaria angustifolia',
    'Pinheiro Brasileiro - Araucaria angustifolia', 'Pinheiro-brasileiro',
    'MUDA ARAUCARIA', 'MUDAS ARAUCARIA', 'Mudas de Araucaria',
    'MUDAS DE ARAUCARIA - Araucaria angustifolia',
], 'Mudas', 'Araucaria', 'Araucaria', 'R$/unid')

# -----------------------------------------------------------------------------
# MUDAS DE BRACATINGA
# -----------------------------------------------------------------------------
_add_mapping([
    'Bracatinga', 'BRACATINGA', 'Bracatinga - Variedade comum',
    'Bracatinga-comum', 'Bracatinga - Mimosa scabrella',
    'BRACATINGADE C.MOURAO', 'BRACATINGA DE C MOURAO',
    'Mudas de Bracatinga',
    'MUDAS DE BRACATINGA COMUM - Mimosa scabrella',
], 'Mudas', 'Bracatinga', 'Bracatinga', 'R$/unid')

_add_mapping([
    'Bracatinga-Argentina', 'Variedade Argentina',
    'BRACATINGADE C.MOURAO - Mimosa flocculosa',
    'Bracatinga Argentina', 'Mudas de Bracatinga Argentina',
], 'Mudas', 'Bracatinga', 'Bracatinga Argentina', 'R$/unid')

# -----------------------------------------------------------------------------
# MUDAS DE ERVA-MATE
# -----------------------------------------------------------------------------
_add_mapping([
    'Erva-mate', 'ERVA-MATE', 'ERVA-MATE - llex paraguariensis',
    'Erva-mate - Ilex paraguariensis', 'MUDA ERVA-MATE',
    'Mudas de Erva-mate', 'ERVA MATE',
], 'Mudas', 'Erva-mate', 'Erva-mate', 'R$/unid')

# -----------------------------------------------------------------------------
# MUDAS DE EUCALIPTO CLONAL
# -----------------------------------------------------------------------------
_add_mapping([
    'AEC 144 e 224', 'AEC144', 'AEC224',
    'Eucalyptus grancan', 'Eucalyptus grancam',
    'Eucalyptus urograndis', 'Eucalyptus urograndis 144',
    'Eucalyptus uroxgrandis', 'Eucalyptus urograndis - 1528',
    'Eucalyptus urograndis - H13', 'H 144 H 13', 'H 144; H 13',
    'H 144; H 13 e 158', 'I 144; H 13 e 158', 'H144', 'H13', 'I144',
    'UROPHILA GRANDIS', 'EUCA 105 H13', 'URO GRANDIS',
    'UROPHILA GRANDIS â€“ EUCA 105 H13 (URO GRANDIS)',
    'Eucalyptus urophylla', 'Eucalyptus urophylla 1528, 2070',
    'Eucalyptus urophylla GG100, GG157, 2361',
    'Eucalyptus urophylla GG100, GG157, 2361, 2070',
    'GG100', 'GG157', '2361', '2070', '1528',
    'Eucalyptus saligna, E. dunnii',
    'Mudas de Eucalipto Clonal', 'EUCALIPTO CLONAL',
    'MUDAS DE EUCALIPTO - Eucalyptus urograndis',
], 'Mudas', 'Eucalipto Clonal', 'Eucalipto Clonal', 'R$/unid')

# -----------------------------------------------------------------------------
# MUDAS DE EUCALIPTO SEMINAL (propagacao por sementes)
# -----------------------------------------------------------------------------
_add_mapping([
    'Eucalipto benthamii', 'E. benthamii', 'Eucalyptus benthamii',
    'Mudas de Eucalyptus benthamii',
    'MUDAS DE EUCALIPTO - Eucalyptus benthamii',
], 'Mudas', 'Eucalipto Seminal', 'Eucalyptus benthamii', 'R$/unid')

_add_mapping([
    'Eucalipto camaldulensis', 'E. camaldulensis', 'Eucalyptus camaldulensis',
    'Mudas de Eucalyptus camaldulensis',
], 'Mudas', 'Eucalipto Seminal', 'Eucalyptus camaldulensis', 'R$/unid')

_add_mapping([
    'Eucalipto citriodora', 'E. citriodora', 'Eucalyptus citriodora',
    'Corymbia citriodora', 'Mudas de Corymbia citriodora',
    'MUDAS DE EUCALIPTO - Corymbia citriodora',
], 'Mudas', 'Eucalipto Seminal', 'Eucalyptus citriodora', 'R$/unid')

_add_mapping([
    'Eucalipto dunnii', 'E. dunnii', 'Eucalyptus dunnii',
    'Eucalipto - E. dunnii', 'Mudas de Eucalyptus dunnii',
    'MUDAS DE EUCALIPTO - Eucalyptus dunnii',
], 'Mudas', 'Eucalipto Seminal', 'Eucalyptus dunnii', 'R$/unid')

_add_mapping([
    'Eucalipto grandis', 'E. grandis', 'Eucalyptus grandis',
    'Mudas de Eucalyptus grandis',
    'MUDAS DE EUCALIPTO - Eucalyptus grandis',
], 'Mudas', 'Eucalipto Seminal', 'Eucalyptus grandis', 'R$/unid')

_add_mapping([
    'Eucalipto saligna', 'E. saligna', 'Eucalyptus saligna',
    'EUCALIPTO - E. saligna', 'Mudas de Eucalyptus saligna',
    'MUDAS DE EUCALIPTO - Eucalyptus saligna',
], 'Mudas', 'Eucalipto Seminal', 'Eucalyptus saligna', 'R$/unid')

_add_mapping([
    'Eucalipto viminalis', 'E. viminalis', 'Eucalyptus viminalis',
    'Mudas de Eucalyptus viminalis',
    'MUDAS DE EUCALIPTO - Eucalyptus viminalis',
], 'Mudas', 'Eucalipto Seminal', 'Eucalyptus viminalis', 'R$/unid')

_add_mapping([
    'Eucalyptus urophylla', 'Mudas de Eucalyptus urophylla',
], 'Mudas', 'Eucalipto Seminal', 'Eucalyptus urophylla', 'R$/unid')

# -----------------------------------------------------------------------------
# MUDAS DE PINUS SEMINAL
# -----------------------------------------------------------------------------
_add_mapping([
    'Pinus elliottii', 'P. elliottii', 'Pinus - P. elliottii',
    'Mudas de Pinus elliottii',
    'MUDAS DE PINUS - Pinus elliottii',
], 'Mudas', 'Pinus Seminal', 'Pinus elliottii', 'R$/unid')

_add_mapping([
    'Pinus taeda', 'P. taeda', 'Mudas de Pinus taeda',
    'MUDAS DE PINUS - Pinus taeda',
], 'Mudas', 'Pinus Seminal', 'Pinus taeda', 'R$/unid')

_add_mapping([
    'Pinus tropicais', 'Tropicais', 'Mudas de Pinus tropicais',
    'MUDAS DE PINUS - Tropicais',
], 'Mudas', 'Pinus Seminal', 'Pinus tropicais', 'R$/unid')

# -----------------------------------------------------------------------------
# MUDAS DE PALMITO
# -----------------------------------------------------------------------------
_add_mapping([
    'Palmito Jucara', 'Palmito JuÃ§ara', 'Palmito JuÃ§ara - Euterpe edulis',
    'Euterpe edulis', 'Jucara', 'Mudas de Palmito Jucara',
    'MUDAS DE PALMITO-JUCARA - Euterpe edulis',
], 'Mudas', 'Palmito', 'Palmito Jucara', 'R$/unid')

_add_mapping([
    'Palmito Pupunha', 'Palmito Pupunha - Euterpe oleracea',
    'Euterpe oleracea', 'Pupunha', 'Mudas de Palmito Pupunha',
    'Bactris gasipaes',
    'MUDAS DE PALMITO-PUPUNHA - Bactris gasipaes',
], 'Mudas', 'Palmito', 'Palmito Pupunha', 'R$/unid')

# -----------------------------------------------------------------------------
# MUDAS DE NATIVAS
# -----------------------------------------------------------------------------
_add_mapping([
    'Angico', 'ANGICO-BRANCO', 'ANGICO BRANCO',
    'Angico branco - Anadenanthera colubrina',
    'MUDAS DE ANGICO-BRANCO - Anadenanthera colubrina',
    'MUDAS DE ANGICO-BRANCO - Anadenanthera colubrina - R$/unid.',
    'MUDAS DE ANGICO-BRANCO - Anadenanthera colubrina - R$/unidade',
    'Anadenanthera colubrina', 'Mudas de Angico',
], 'Mudas', 'Nativas', 'Angico', 'R$/unid')

_add_mapping([
    'Aroeira', 'AROEIRA VERMELHA', 'AROEIRA-VERMELHA',
    'AROEIRA VERMELHA - Schinus terebinthifolius',
    'MUDAS DE AROEIRA VERMELHA - Schinus terebinthifolius',
    'MUDAS DE AROEIRA VERMELHA - Schinus terebinthifolius - R$/unid.',
    'MUDAS DE AROEIRA VERMELHA - Schinus terebinthifolius - R$/unidade',
    'MUDAS ENERGIA E REVEGETACAO AROEIRA VERMELHA (Schinus terebinthifolius) muda/saquinho',
    'Schinus terebinthifolius', 'Mudas de Aroeira',
], 'Mudas', 'Nativas', 'Aroeira', 'R$/unid')

_add_mapping([
    'Canafistula', 'CANAFISTOLA', 'CANAFISTULA',
    'CANAFISTOLA - Peltophorum dubium', 'CANAFISTULA - Peltophorum dubium',
    'MUDAS DE CANAFISTULA - Peltophorum dubium',
    'MUDAS DE CANAFISTULA - Peltophorum dubium - R$/unid.',
    'MUDAS DE CANAFISTULA - Peltophorum dubium - R$/unidade',
    'Peltophorum dubium', 'Mudas de Canafistula',
], 'Mudas', 'Nativas', 'Canafistula', 'R$/unid')

_add_mapping([
    'Canela', 'CANELA-GUAICA', 'CANELA GUAICA',
    'Canela-guaica - Ocotea puberula',
    'MUDAS DE CANELA-GUAICA - Ocotea puberula',
    'MUDAS DE CANELA-GUAICA - Ocotea puberula - R$/unid.',
    'MUDAS DE CANELA-GUAICA - Ocotea puberula - R$/unidade',
    'Ocotea puberula', 'Mudas de Canela',
], 'Mudas', 'Nativas', 'Canela', 'R$/unid')

_add_mapping([
    'Caroba', 'CAROBA', 'CAROBA - Jacaranda micrantha',
    'MUDAS DE CAROBA - Jacaranda micrantha',
    'MUDAS DE CAROBA - Jacaranda micrantha - R$/unid.',
    'MUDAS DE CAROBA - Jacaranda micrantha - R$/unidade',
    'MUDAS REFLORESTAMENTO AMBIENTAL CAROBA (Jacaranda micrantha) muda/saquinho',
    'Jacaranda micrantha', 'Mudas de Caroba',
], 'Mudas', 'Nativas', 'Caroba', 'R$/unid')

_add_mapping([
    'Cassia', 'CASSIA', 'CASSIA - Cassia leptophylla',
    'MUDAS DE CASSIA - Cassia leptophylla',
    'MUDAS DE CASSIA - Cassia leptophylla - R$/unidade',
    'Cassia leptophylla', 'Mudas de Cassia',
], 'Mudas', 'Nativas', 'Cassia', 'R$/unid')

_add_mapping([
    'Cedro', 'CEDRO', 'CEDRO - Cedrela fissilis',
    'MUDAS DE CEDRO - Cedrela fissilis',
    'MUDAS DE CEDRO - Cedrela fissilis - R$/unid.',
    'MUDAS DE CEDRO - Cedrela fissilis - R$/unidade',
    'Cedrela fissilis', 'Mudas de Cedro',
], 'Mudas', 'Nativas', 'Cedro', 'R$/unid')

_add_mapping([
    'Extremosa', 'EXTREMOSA', 'EXTREMOSA - Lagerstroemia indica',
    'MUDAS DE EXTREMOSA - Lagerstroemia indica',
    'MUDAS DE EXTREMOSA - Lagerstroemia indica - R$/unidade',
    'MUDAS ORNAMENTAIS EXOTICAS EXTREMOSA (Lagerstroemia indica) muda/saquinho',
    'Lagerstroemia indica', 'Mudas de Extremosa',
], 'Mudas', 'Nativas', 'Extremosa', 'R$/unid')

_add_mapping([
    'Flamboyant', 'FLAMBOYANT', 'FLAMBOYANT - Delonix regia',
    'MUDAS DE FLAMBOYANT - Delonix regia',
    'MUDAS DE FLAMBOYANT - Delonix regia - R$/unidade',
    'MUDAS ORNAMENTAIS EXOTICAS FLAMBOYANT (Delonix regia) muda/saquinho',
    'Delonix regia', 'Mudas de Flamboyant',
], 'Mudas', 'Nativas', 'Flamboyant', 'R$/unid')

_add_mapping([
    'Imbuia', 'IMBUIA', 'IMBUIA - Ocotea porosa',
    'MUDAS DE IMBUIA - Ocotea porosa',
    'MUDAS DE IMBUIA - Ocotea porosa - R$/unid.',
    'MUDAS DE IMBUIA - Ocotea porosa - R$/unidade',
    'Ocotea porosa', 'Mudas de Imbuia',
], 'Mudas', 'Nativas', 'Imbuia', 'R$/unid')

_add_mapping([
    'Ipe', 'IPE AMARELO', 'IPE ROXO', 'IPE-AMARELO', 'IPE-ROXO',
    'IPE AMARELO - Tabebuia alba', 'IPE ROXO - Tabebuia heptaphylla',
    'MUDAS DE IPE AMARELO - Tabebuia alba',
    'MUDAS DE IPE AMARELO - Tabebuia alba - R$/unidade',
    'MUDAS DE IPE ROXO - Tabebuia heptaphylla',
    'MUDAS DE IPE ROXO - Tabebuia heptaphylla - R$/unidade',
    'Tabebuia alba', 'Tabebuia heptaphylla', 'Mudas de Ipe',
], 'Mudas', 'Nativas', 'Ipe', 'R$/unid')

_add_mapping([
    'Jacaranda', 'JACARANDA', 'Jacaranda mimoso',
    'Jacaranda mimosifolia', 'Mudas de Jacaranda',
], 'Mudas', 'Nativas', 'Jacaranda', 'R$/unid')

_add_mapping([
    'Manduirana', 'MANDUIRANA', 'MANDUIRANA - Senna macranthera',
    'MUDAS DE MANDUIRANA - Senna macranthera',
    'MUDAS DE MANDUIRANA - Senna macranthera - R$/unidade',
    'Senna macranthera', 'Mudas de Manduirana',
], 'Mudas', 'Nativas', 'Manduirana', 'R$/unid')

_add_mapping([
    'Paineira', 'PAINEIRA', 'PAINEIRA - Chorisia speciosa',
    'PAINEIRA - Ceiba speciosa',
    'MUDAS DE PAINEIRA - Ceiba speciosa',
    'MUDAS DE PAINEIRA - Ceiba speciosa - R$/unid.',
    'MUDAS DE PAINEIRA - Ceiba speciosa - R$/unidade',
    'MUDAS REFLORESTAMENTO AMBIENTAL PAINEIRA (Ceiba speciosa) muda/saquinho',
    'Ceiba speciosa', 'Chorisia speciosa', 'Mudas de Paineira',
], 'Mudas', 'Nativas', 'Paineira', 'R$/unid')

_add_mapping([
    'Peroba', 'PEROBA', 'PEROBA - Aspidosperma polyneuron',
    'Peroba - Aspidosperma polyneuron',
    'MUDAS DE PEROBA - Aspidosperma polyneuron',
    'MUDAS DE PEROBA - Aspidosperma polyneuron - R$/unid.',
    'MUDAS DE PEROBA - Aspidosperma polyneuron - R$/unidade',
    'Aspidosperma polyneuron', 'Mudas de Peroba',
], 'Mudas', 'Nativas', 'Peroba', 'R$/unid')

_add_mapping([
    'Tipuana', 'TIPUANA', 'TIPUANA - Tipuana tipu',
    'Tipuana - Tipuana tipu',
    'MUDAS DE TIPUANA - Tipuana tipu',
    'MUDAS DE TIPUANA - Tipuana tipu - R$/unidade',
    'MUDAS ORNAMENTAIS EXOTICAS TIPUANA (Tipuana tipu) muda/saquinho',
    'Tipuana tipu', 'Mudas de Tipuana',
], 'Mudas', 'Nativas', 'Tipuana', 'R$/unid')

_add_mapping([
    'Grevilha', 'GREVILHA', 'GREVILEA', 'Grevillea robusta',
    'Grevilha - Grevillea robusta', 'Mudas de Grevilha',
], 'Mudas', 'Nativas', 'Grevilha', 'R$/unid')

_add_mapping([
    'Mogno', 'MOGNO', 'Swietenia macrophylla', 'Mudas de Mogno',
], 'Mudas', 'Nativas', 'Mogno', 'R$/unid')

_add_mapping([
    'Cerejeira', 'CEREJEIRA', 'Eugenia involucrata', 'Mudas de Cerejeira',
], 'Mudas', 'Nativas', 'Cerejeira', 'R$/unid')

_add_mapping([
    'Nativas Diversas', 'NATIVAS DIVERSAS', 'EXOTICAS',
    'Outras Especies Nativas', 'Essencias florestais diversas',
    'Mudas de essencias florestais nativas diversas',
], 'Mudas', 'Nativas', 'Nativas Diversas', 'R$/unid')

# -----------------------------------------------------------------------------
# SEMENTES
# -----------------------------------------------------------------------------
_add_mapping([
    'SEMENTES EUCALIPTO (Eucalyptus dunnii) kg',
    'SEMENTES DE EUCALIPTO Eucalyptus dunnii',
    'SEMENTES  EUCALIPTO (Eucalyptus dunnii) kg',
    'Sementes de Eucalyptus dunnii', 'Sementes Eucalyptus dunnii',
], 'Sementes', 'Eucalipto', 'Sementes Eucalyptus dunnii', 'R$/kg')

_add_mapping([
    'SEMENTES EUCALIPTO (Eucalyptus grandis) kg',
    'SEMENTES DE EUCALIPTO Eucalyptus grandis',
    'SEMENTES  EUCALIPTO (Eucalyptus grandis) kg',
    'Sementes de Eucalyptus grandis', 'Sementes Eucalyptus grandis',
], 'Sementes', 'Eucalipto', 'Sementes Eucalyptus grandis', 'R$/kg')

_add_mapping([
    'SEMENTES EUCALIPTO (Eucalyptus saligna) kg',
    'SEMENTES DE EUCALIPTO Eucalyptus saligna',
    'SEMENTES  EUCALIPTO (Eucalyptus saligna) kg',
    'Sementes de Eucalyptus saligna', 'Sementes Eucalyptus saligna',
], 'Sementes', 'Eucalipto', 'Sementes Eucalyptus saligna', 'R$/kg')

_add_mapping([
    'SEMENTES EUCALIPTO (Eucalyptus viminalis) kg',
    'SEMENTES DE EUCALIPTO Eucalyptus viminalis',
    'SEMENTES  EUCALIPTO (Eucalyptus viminalis) kg',
    'Sementes de Eucalyptus viminalis', 'Sementes Eucalyptus viminalis',
], 'Sementes', 'Eucalipto', 'Sementes Eucalyptus viminalis', 'R$/kg')

# -----------------------------------------------------------------------------
# TORAS DE ARAUCARIA
# -----------------------------------------------------------------------------
_add_mapping([
    'Tora Araucaria', 'Toras Araucaria', 'TORA ARAUCARIA',
    'Araucaria > 40 cm', 'ARAUCARIA > 40', 'Toras de Araucaria',
    'TORAS DE ARAUCARIA EM PE',
], 'Toras', 'Araucaria', 'Toras Araucaria', 'R$/m3')

# -----------------------------------------------------------------------------
# TORAS DE EUCALIPTO
# -----------------------------------------------------------------------------
_add_mapping([
    'TORAS DE EUCALIPTO EM PE - DIAMETRO < 14 cm',
    'Toras Eucalipto < 14 cm',
], 'Toras', 'Eucalipto', 'Toras Eucalipto < 14 cm', 'R$/m3')

_add_mapping([
    'Eucalipto 14 - 18 cm', 'Eucalipto 14-18 cm', 'EUCALIPTO 14-18',
    'Toras Eucalipto 14-18 cm',
    'TORAS DE EUCALIPTO EM PE - DIAMETRO 14 - 18 cm',
], 'Toras', 'Eucalipto', 'Toras Eucalipto 14-18 cm', 'R$/m3')

_add_mapping([
    'Eucalipto 18 - 25 cm', 'Eucalipto 18-25 cm', 'EUCALIPTO 18-25',
    'Eucalipto 20 - 30 cm', 'Eucalipto 20-30 cm',
    'Toras Eucalipto 18-25 cm',
    'TORAS DE EUCALIPTO EM PE - DIAMETRO 18 - 25 cm',
], 'Toras', 'Eucalipto', 'Toras Eucalipto 18-25 cm', 'R$/m3')

_add_mapping([
    'Eucalipto 25 - 35 cm', 'Eucalipto 25-35 cm', 'EUCALIPTO 25-35',
    'Eucalipto 30 - 40 cm', 'Eucalipto 30-40 cm',
    'Toras Eucalipto 25-35 cm',
    'TORAS DE EUCALIPTO EM PE - DIAMETRO 25 - 35 cm',
], 'Toras', 'Eucalipto', 'Toras Eucalipto 25-35 cm', 'R$/m3')

_add_mapping([
    'Eucalipto > 35 cm', 'Eucalipto > 30 cm', 'Eucalipto > 40 cm',
    'EUCALIPTO > 35', 'EUCALIPTO > 40',
    'Toras Eucalipto > 35 cm',
    'TORAS DE EUCALIPTO EM PE - DIAMETRO > 35 cm',
], 'Toras', 'Eucalipto', 'Toras Eucalipto > 35 cm', 'R$/m3')

_add_mapping([
    'Eucalipto Geral', 'EUCALIPTO GERAL', 'Toras Eucalipto Geral',
    'TORA EUCALIPTO',
], 'Toras', 'Eucalipto', 'Toras Eucalipto Geral', 'R$/m3')

_add_mapping([
    'Eucalipto Media Estado', 'Eucalipto MÃ©dia Estado',
    'EUCALIPTO MEDIA ESTADO', 'Toras Eucalipto Media Estado',
    'TORAS DE EUCALIPTO EM PE - media sortimentos Estado',
], 'Toras', 'Eucalipto', 'Toras Eucalipto Media Estado', 'R$/m3')

# -----------------------------------------------------------------------------
# TORAS DE PINUS
# -----------------------------------------------------------------------------
_add_mapping([
    'Pinus 10 - 20 cm', 'Pinus 10-20 cm', 'PINUS < 14',
    'Toras Pinus < 14 cm',
    'TORAS DE PINUS EM PE - DIAMETRO < 14 cm',
], 'Toras', 'Pinus', 'Toras Pinus < 14 cm', 'R$/m3')

_add_mapping([
    'Pinus 14 - 18 cm', 'Pinus 14-18 cm', 'PINUS 14-18',
    'Toras Pinus 14-18 cm',
    'TORAS DE PINUS EM PE - DIAMETRO 14 - 18 cm',
], 'Toras', 'Pinus', 'Toras Pinus 14-18 cm', 'R$/m3')

_add_mapping([
    'Pinus 18 - 25 cm', 'Pinus 18-25 cm', 'PINUS 18-25',
    'Pinus 20 - 30 cm', 'Pinus 20-30 cm',
    'Toras Pinus 18-25 cm',
    'TORAS DE PINUS EM PE - DIAMETRO 18 - 25 cm',
], 'Toras', 'Pinus', 'Toras Pinus 18-25 cm', 'R$/m3')

_add_mapping([
    'Pinus 25 - 35 cm', 'Pinus 25-35 cm', 'PINUS 25-35',
    'Pinus 30 - 40 cm', 'Pinus 30-40 cm',
    'Toras Pinus 25-35 cm',
    'TORAS DE PINUS EM PE - DIAMETRO 25 - 35 cm',
], 'Toras', 'Pinus', 'Toras Pinus 25-35 cm', 'R$/m3')

_add_mapping([
    'Pinus > 35 cm', 'Pinus > 40 cm', 'PINUS > 35', 'PINUS > 40',
    'Toras Pinus > 35 cm',
    'TORAS DE PINUS EM PE - DIAMETRO > 35 cm',
], 'Toras', 'Pinus', 'Toras Pinus > 35 cm', 'R$/m3')

_add_mapping([
    'Pinus Geral', 'PINUS GERAL', 'Toras Pinus Geral',
    'TORA PINUS',
], 'Toras', 'Pinus', 'Toras Pinus Geral', 'R$/m3')

_add_mapping([
    'Pinus Media Estado', 'Pinus MÃ©dia Estado',
    'PINUS MEDIA ESTADO', 'Toras Pinus Media Estado',
    'TORAS DE PINUS EM PE - media sortimentos Estado',
], 'Toras', 'Pinus', 'Toras Pinus Media Estado', 'R$/m3')

# -----------------------------------------------------------------------------
# TORAS DE NATIVAS
# -----------------------------------------------------------------------------
_add_mapping([
    'TORAS DE CANELA EM PE - DIAMETRO > 30 cm',
    'TORAS DE CANELA NA LAMINADORA - DIAMETRO > 40 cm',
    'TORAS DE CANELA NA SERRARIA - DIAMETRO > 30 cm',
    'TORAS EM PE CANELA > 30 CM m3', 'TORAS POSTO LAMINADORA CANELA > 40 CM m3',
    'TORAS POSTO NA SERRARIA CANELA > 30 cm m3',
    'Canela > 30 cm', 'Canela > 40 cm', 'Toras Canela',
], 'Toras', 'Nativas', 'Toras Canela', 'R$/m3')

_add_mapping([
    'TORAS DE CEDRO EM PE - DIAMETRO > 30 cm',
    'TORAS EM PE CEDRO > 30 CM m3', 'Cedro > 30 cm', 'Toras Cedro',
], 'Toras', 'Nativas', 'Toras Cedro', 'R$/m3')

_add_mapping([
    'TORAS DE CEREJEIRA NA LAMINADORA - DIAMETRO > 70 cm',
    'TORAS POSTO LAMINADORA CEREJEIRA > 70 CM m3',
    'Cerejeira > 70 cm', 'Toras Cerejeira',
], 'Toras', 'Nativas', 'Toras Cerejeira', 'R$/m3')

_add_mapping([
    'TORAS DE GREVILEA EM PE - DIAMETRO > 30 cm',
    'TORAS EM PE GREVILEA > 30 CM m3', 'Grevilha > 30 cm', 'Toras Grevilha',
], 'Toras', 'Nativas', 'Toras Grevilha', 'R$/m3')

_add_mapping([
    'TORAS DE IMBUIA NA SERRARIA - DIAMETRO > 45 cm',
    'TORAS POSTO NA SERRARIA IMBUIA > 45 cm m3',
    'TORAS POSTO NA SERRARIA IMBUIA 30 - 40 cm m3',
    'TORAS POSTO NA SERRARIA IMBUIA 30 cm m3',
    'TORAS POSTO LAMINADORA IMBUIA (01 FILE) m3',
    'TORAS POSTO LAMINADORA IMBUIA (02 FILES) m3',
    'TORAS EM PE IMBUIA > 30 CM m3',
    'Imbuia > 30 cm', 'Imbuia 30 - 40 cm', 'Toras Imbuia',
], 'Toras', 'Nativas', 'Toras Imbuia', 'R$/m3')

_add_mapping([
    'TORAS DE MOGNO NA LAMINADORA - DIAMETRO > 70 cm',
    'Mogno > 70 cm', 'Toras Mogno',
], 'Toras', 'Nativas', 'Toras Mogno', 'R$/m3')

_add_mapping([
    'Angico > 30 cm', 'Toras Angico',
], 'Toras', 'Nativas', 'Toras Angico', 'R$/m3')

_add_mapping([
    'Peroba > 30 cm', 'Toras Peroba',
], 'Toras', 'Nativas', 'Toras Peroba', 'R$/m3')

_add_mapping([
    'TORAS DE ALAMO EM PE', 'Alamo', 'Toras Alamo',
], 'Toras', 'Nativas', 'Toras Alamo', 'R$/m3')

_add_mapping([
    'TORAS DE MADEIRA DE LEI NA LAMINADORA',
    'TORAS POSTO LAMINADORA MADEIRA DE LEI m3',
    'Toras Madeira de Lei',
], 'Toras', 'Nativas', 'Toras Madeira de Lei', 'R$/m3')

_add_mapping([
    'Outras Especies', 'OUTRAS ESPECIES', 'Toras Outras Especies',
    'TORAS DE OUTRAS ESPECIES EM PE',
], 'Toras', 'Nativas', 'Toras Outras Especies', 'R$/m3')

# -----------------------------------------------------------------------------
# TORAS PARA PROCESSO
# -----------------------------------------------------------------------------
_add_mapping([
    'Tora para Processo', 'TORA PROCESSO', 'Toras Processo',
    'Tora para processo',
    'TORA PARA PROCESSO (Inclui madeira para papel e celulose)',
    'TORA PARA PROCESSO',
], 'Toras', 'Processo', 'Toras Processo', 'R$/m3')

_add_mapping([
    'Escoras/Outras', 'ESCORAS', 'Escoras', 'Outras finalidades',
    'TORA PARA OUTRAS FINALIDADES',
    'TORA PARA OUTRAS FINALIDADES (Por exemplo escoras)',
], 'Toras', 'Processo', 'Escoras', 'R$/m3')

# -----------------------------------------------------------------------------
# LENHA
# -----------------------------------------------------------------------------
_add_mapping([
    'Lenha', 'LENHA', 'Lenha metro estereo',
    'LENHA POSTA NO CONSUMIDOR',
], 'Energia', 'Lenha', 'Lenha', 'R$/m3')

# -----------------------------------------------------------------------------
# CAVACOS
# -----------------------------------------------------------------------------
_add_mapping([
    'Cavaco Limpo', 'CAVACO LIMPO', 'Cavaco', 'CAVACO',
    'CAVACO LIMPO ONDE FOI PRODUZIDO',
    'CAVACO LIMPO ONDE FOI PRODUZIDO (cavaco para processo)',
], 'Cavacos', 'Limpo', 'Cavaco Limpo', 'R$/t')

_add_mapping([
    'Cavaco Sujo', 'CAVACO SUJO', 'Cavaco Sujo (Energia)',
    'Cavaco para energia',
    'CAVACO SUJO ONDE FOI PRODUZIDO',
    'CAVACO SUJO ONDE FOI PRODUZIDO (cavaco para energia)',
], 'Cavacos', 'Sujo', 'Cavaco Sujo', 'R$/t')

# -----------------------------------------------------------------------------
# PFNM - ERVA-MATE FOLHA (producao primaria)
# -----------------------------------------------------------------------------
_add_mapping([
    'Erva-mate Industria', 'Erva-mate IndÃºstria',
    'FOLHA NA INDUSTRIA', 'FOLHA NA INDÃšSTRIA',
    'Erva-mate Folha Industria',
    'FOLHA DE ERVA-MATE NA INDUSTRIA',
], 'PFNM', 'Erva-mate Folha', 'Erva-mate Folha Industria', 'R$/kg')

_add_mapping([
    'Erva-mate no Pe', 'Erva-mate no PÃ©',
    'FOLHA NO PE', 'FOLHA NO PÃ‰',
    'Erva-mate Folha Pe',
    'FOLHA DE ERVA-MATE NO PE',
], 'PFNM', 'Erva-mate Folha', 'Erva-mate Folha Pe', 'R$/kg')

_add_mapping([
    'FOLHA NO BARRANCO', 'Erva-mate Folha Barranco',
], 'PFNM', 'Erva-mate Folha', 'Erva-mate Folha Barranco', 'R$/kg')

# -----------------------------------------------------------------------------
# PRODUTOS BENEFICIADOS - ERVA-MATE PROCESSADA
# -----------------------------------------------------------------------------
_add_mapping([
    'ERVA - MATE CANCHEADA', 'Erva-mate Cancheada', 'Cancheada',
], 'Produtos Beneficiados', 'Erva-mate', 'Erva-mate Cancheada', 'R$/kg')

_add_mapping([
    'E - ERVA - MATE BENEFICIADA', 'Erva-mate Beneficiada', 'Beneficiada',
], 'Produtos Beneficiados', 'Erva-mate', 'Erva-mate Beneficiada', 'R$/kg')

_add_mapping([
    'INDUSTRIAL - (Kg)', 'INDÃšSTRIAL - (Kg)', 'Erva-mate Industrial',
], 'Produtos Beneficiados', 'Erva-mate', 'Erva-mate Industrial', 'R$/kg')

_add_mapping([
    'MERCADO - ERVA-MATE TIPO PN 1', 'Goma/po/palitos',
    'VAREJISTA - (Kg)', 'Erva-mate Mercado', 'Erva-mate Varejista',
], 'Produtos Beneficiados', 'Erva-mate', 'Erva-mate Mercado', 'R$/kg')

# -----------------------------------------------------------------------------
# PFNM - OUTROS
# -----------------------------------------------------------------------------
_add_mapping([
    'Palmito (cabeca)', 'Palmito (cabeÃ§a)', 'Palmito Cabeca',
    'PALMITO CABECA',
], 'PFNM', 'Palmito', 'Palmito Cabeca', 'R$/cabeca')

_add_mapping([
    'Latex de Seringueira', 'LÃ¡tex de Seringueira',
    'LATEX SERINGUEIRA', 'SERINGUEIRA',
    'SERINGUEIRA (LATEX)',
], 'PFNM', 'Latex', 'Latex Seringueira', 'R$/kg')

_add_mapping([
    'Pinhao', 'PinhÃ£o', 'PINHAO',
], 'PFNM', 'Pinhao', 'Pinhao', 'R$/kg')

_add_mapping([
    'Resina', 'RESINA', 'Resina de Pinus', 'Resina Pinus',
], 'PFNM', 'Resina', 'Resina Pinus', 'R$/kg')

# -----------------------------------------------------------------------------
# ENERGIA - CARVAO
# -----------------------------------------------------------------------------
_add_mapping([
    'Carvao', 'CarvÃ£o', 'CARVAO', 'Carvao Vegetal',
], 'Energia', 'Carvao', 'Carvao Vegetal', 'R$/kg')

# -----------------------------------------------------------------------------
# CUSTOS OPERACIONAIS
# -----------------------------------------------------------------------------
_add_mapping([
    'Custos de Colheita e Carregamento', 'CUSTOS COLHEITA',
    'Custos Colheita e Carregamento', 'CUSTO COLHEITA',
    'Custos de Colheita',
], 'Custos Operacionais', 'Colheita', 'Custos Colheita e Carregamento', 'R$/m3')

# -----------------------------------------------------------------------------
# MADEIRA SERRADA
# -----------------------------------------------------------------------------
_add_mapping([
    'PINUS (1" x 4" x 2,40m)', 'Madeira Serrada Pinus',
    'Madeira Serrada de Pinus',
], 'Madeira Serrada', 'Pinus', 'Madeira Serrada Pinus', 'R$/m3')

_add_mapping([
    'EUCALIPTO (1"x 4" x 2,40m)', 'Madeira Serrada Eucalipto',
    'Madeira Serrada de Eucalipto',
], 'Madeira Serrada', 'Eucalipto', 'Madeira Serrada Eucalipto', 'R$/m3')

_add_mapping([
    'ARAUCARIA( 1" x 4" x 2,40m)', 'Madeira Serrada Araucaria',
    'Madeira Serrada de Araucaria',
], 'Madeira Serrada', 'Araucaria', 'Madeira Serrada Araucaria', 'R$/m3')

_add_mapping([
    'CEDRO ( 1" x 4" x 2,40m)', 'Madeira Serrada Cedro',
    'Madeira Serrada de Cedro',
], 'Madeira Serrada', 'Nativas', 'Madeira Serrada Cedro', 'R$/m3')

_add_mapping([
    'IMBUIA (1,5" x 5" x 2,20m)', 'IMBUIA (1,5" x 9" x 2,20m)',
    'Madeira Serrada Imbuia', 'Madeira Serrada de Imbuia',
], 'Madeira Serrada', 'Nativas', 'Madeira Serrada Imbuia', 'R$/m3')

_add_mapping([
    'CEREJEIRA ( 1,5" x 5" x 2,20m)', 'Madeira Serrada Cerejeira',
    'Madeira Serrada de Cerejeira',
], 'Madeira Serrada', 'Nativas', 'Madeira Serrada Cerejeira', 'R$/m3')

_add_mapping([
    'MOGNO (1,5" x 5" x 2,20m)', 'Madeira Serrada Mogno',
    'Madeira Serrada de Mogno',
], 'Madeira Serrada', 'Nativas', 'Madeira Serrada Mogno', 'R$/m3')

_add_mapping([
    'GREVILEA (1"x 4" x 2,40m)', 'Madeira Serrada Grevilha',
    'Madeira Serrada de Grevilha',
], 'Madeira Serrada', 'Nativas', 'Madeira Serrada Grevilha', 'R$/m3')

# -----------------------------------------------------------------------------
# RESIDUOS
# -----------------------------------------------------------------------------
_add_mapping([
    'COSTANEIRAS (DZ)', 'Costaneiras',
], 'Residuos', 'Geral', 'Costaneiras', 'R$/dz')

_add_mapping([
    'DESTOPO (m3)', 'Destopo',
], 'Residuos', 'Geral', 'Destopo', 'R$/m3')

_add_mapping([
    'REFIO ( M/ESTEREO)', 'REFIO (st)', 'Refilo',
], 'Residuos', 'Geral', 'Refilo', 'R$/st')

_add_mapping([
    'SEPILHO / PO DE SERRA (M3)', 'SERRAGEM (M3)', 'Serragem',
], 'Residuos', 'Geral', 'Serragem', 'R$/m3')


# =============================================================================
# FUNCOES AUXILIARES
# =============================================================================

def fix_mojibake(text):
    """Corrige problemas de encoding"""
    if pd.isna(text):
        return text
    value = str(text)
    if not value:
        return value
    if 'Ãƒ' in value or 'Ã‚' in value or 'ï¿½' in value:
        try:
            return value.encode('latin1').decode('utf-8')
        except:
            return value
    return value


def extract_date_from_filename(filename):
    """Extrai ano e mes do nome do arquivo"""
    filename = filename.lower()

    match = re.search(r'(\d{4})_?(\d{2})?([a-z]+)?', filename)
    if match:
        year = int(match.group(1))
        month_from_text = extract_month_from_text(filename, default=None)
        if month_from_text is not None:
            month = month_from_text
        elif match.group(2):
            month = int(match.group(2))
        else:
            month = extract_month_from_text(filename)
        return year, month

    match = re.search(r'flor?(\d{4})([a-z]+)?', filename)
    if match:
        year = int(match.group(1))
        month = extract_month_from_text(match.group(2) or filename)
        return year, month

    match = re.search(r'(\d{4})(\d{2})', filename)
    if match:
        year = int(match.group(1))
        month = int(match.group(2))
        return year, month

    return None, None


def extract_month_from_text(text, default=6):
    """Extrai o mes a partir do texto"""
    months = {
        'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
        'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12,
        'janeiro': 1, 'fevereiro': 2, 'marco': 3, 'abril': 4, 'maio': 5,
        'junho': 6, 'julho': 7, 'agosto': 8, 'setembro': 9, 'outubro': 10,
        'novembro': 11, 'dezembro': 12
    }
    text = text.lower() if text else ''
    for month_name, month_num in months.items():
        if month_name in text:
            return month_num
    return default


def normalize_region_name(name):
    """Normaliza nome da regiao"""
    if pd.isna(name):
        return None
    name = str(name).strip()
    key = normalize_key(name)
    if not key:
        return None

    if key in ('NR', 'NRE', 'NUCLEOREGIONAL'):
        return None

    if 'ESPECIE' in key or 'PRODUTO' in key:
        return None

    if 'PRECO' in key and 'MEDIO' in key:
        return 'Media Estado'

    mapped = REGION_KEY_MAP.get(key)
    if mapped:
        return mapped

    for regiao in REGIOES:
        reg_key = normalize_key(regiao)
        if reg_key and (reg_key in key or key in reg_key):
            return regiao

    return None


def classify_product(product_name):
    """
    Classifica um produto usando o mapeamento integrado.
    Retorna (categoria, subcategoria, produto, unidade)
    """
    if pd.isna(product_name):
        return None, None, None, None

    name = fix_mojibake(str(product_name).strip())
    key = normalize_key(name)

    if not key:
        return None, None, None, None

    # Busca direta no mapeamento
    if key in PRODUCT_MAPPING:
        return PRODUCT_MAPPING[key]

    # Busca parcial - encontra a chave mais longa que esta contida
    best_match = None
    best_len = 0
    for map_key, value in PRODUCT_MAPPING.items():
        if map_key in key and len(map_key) > best_len:
            best_match = value
            best_len = len(map_key)

    if best_match:
        return best_match

    # Classificacao por heuristica para produtos nao mapeados
    return classify_by_heuristic(key, name)


def classify_by_heuristic(key, original_name):
    """Classificacao heuristica para produtos nao encontrados no mapeamento"""

    # Custos operacionais
    if 'CUSTO' in key or 'CUSTOS' in key:
        if 'COLHEITA' in key or 'CARREGAMENTO' in key:
            return 'Custos Operacionais', 'Colheita', 'Custos Colheita e Carregamento', 'R$/m3'
        return None, None, None, None

    # Mudas de eucalipto clonal
    if any(x in key for x in ['AEC', 'H144', 'H13', 'CLONAL', 'UROGRANDIS', 'GRANCAM', 'GRANCAN']):
        return 'Mudas', 'Eucalipto Clonal', 'Eucalipto Clonal', 'R$/unid'

    # Mudas de eucalipto seminal
    if 'MUDA' in key and 'EUCALIPTO' in key:
        for sp in ['BENTHAMII', 'CAMALDULENSIS', 'CITRIODORA', 'DUNNII', 'GRANDIS', 'SALIGNA', 'VIMINALIS']:
            if sp in key:
                return 'Mudas', 'Eucalipto Seminal', f'Eucalyptus {sp.lower()}', 'R$/unid'
        return 'Mudas', 'Eucalipto Seminal', 'Eucalyptus grandis', 'R$/unid'

    # Mudas de pinus
    if 'MUDA' in key and 'PINUS' in key:
        for sp in ['ELLIOTTII', 'TAEDA', 'TROPICAIS']:
            if sp in key:
                return 'Mudas', 'Pinus Seminal', f'Pinus {sp.lower()}', 'R$/unid'
        return 'Mudas', 'Pinus Seminal', 'Pinus elliottii', 'R$/unid'

    # Mudas de araucaria
    if 'MUDA' in key and 'ARAUCARIA' in key:
        return 'Mudas', 'Araucaria', 'Araucaria', 'R$/unid'

    # Mudas de erva-mate
    if 'MUDA' in key and ('ERVA' in key or 'MATE' in key):
        return 'Mudas', 'Erva-mate', 'Erva-mate', 'R$/unid'

    # Mudas de palmito
    if 'MUDA' in key and 'PALMITO' in key:
        if 'JUCARA' in key:
            return 'Mudas', 'Palmito', 'Palmito Jucara', 'R$/unid'
        if 'PUPUNHA' in key:
            return 'Mudas', 'Palmito', 'Palmito Pupunha', 'R$/unid'
        return 'Mudas', 'Palmito', 'Palmito Jucara', 'R$/unid'

    # Mudas de bracatinga
    if 'MUDA' in key and 'BRACATINGA' in key:
        if 'ARGENTINA' in key or 'FLOCCULOSA' in key:
            return 'Mudas', 'Bracatinga', 'Bracatinga Argentina', 'R$/unid'
        return 'Mudas', 'Bracatinga', 'Bracatinga', 'R$/unid'

    # Mudas generica
    if 'MUDA' in key:
        return 'Mudas', 'Nativas', 'Nativas Diversas', 'R$/unid'

    # Sementes
    if 'SEMENT' in key:
        if 'EUCALIPTO' in key or 'EUCALYPTUS' in key:
            for sp in ['DUNNII', 'GRANDIS', 'SALIGNA', 'VIMINALIS']:
                if sp in key:
                    return 'Sementes', 'Eucalipto', f'Sementes Eucalyptus {sp.lower()}', 'R$/kg'
            return 'Sementes', 'Eucalipto', 'Sementes Eucalyptus grandis', 'R$/kg'
        return None, None, None, None

    # Toras
    if 'TORA' in key:
        # Toras de araucaria
        if 'ARAUCARIA' in key:
            return 'Toras', 'Araucaria', 'Toras Araucaria', 'R$/m3'

        # Toras de eucalipto por diametro
        if 'EUCALIPTO' in key or 'EUCALYPTUS' in key:
            if '14' in key and '18' in key:
                return 'Toras', 'Eucalipto', 'Toras Eucalipto 14-18 cm', 'R$/m3'
            if '18' in key and '25' in key:
                return 'Toras', 'Eucalipto', 'Toras Eucalipto 18-25 cm', 'R$/m3'
            if '20' in key and '30' in key:
                return 'Toras', 'Eucalipto', 'Toras Eucalipto 18-25 cm', 'R$/m3'
            if '25' in key and '35' in key:
                return 'Toras', 'Eucalipto', 'Toras Eucalipto 25-35 cm', 'R$/m3'
            if '30' in key and '40' in key:
                return 'Toras', 'Eucalipto', 'Toras Eucalipto 25-35 cm', 'R$/m3'
            if '>35' in key or '>40' in key or '35' in key:
                return 'Toras', 'Eucalipto', 'Toras Eucalipto > 35 cm', 'R$/m3'
            if 'MEDIA' in key and 'ESTADO' in key:
                return 'Toras', 'Eucalipto', 'Toras Eucalipto Media Estado', 'R$/m3'
            return 'Toras', 'Eucalipto', 'Toras Eucalipto Geral', 'R$/m3'

        # Toras de pinus por diametro
        if 'PINUS' in key:
            if '10' in key and '20' in key:
                return 'Toras', 'Pinus', 'Toras Pinus < 14 cm', 'R$/m3'
            if '14' in key and '18' in key:
                return 'Toras', 'Pinus', 'Toras Pinus 14-18 cm', 'R$/m3'
            if '18' in key and '25' in key:
                return 'Toras', 'Pinus', 'Toras Pinus 18-25 cm', 'R$/m3'
            if '20' in key and '30' in key:
                return 'Toras', 'Pinus', 'Toras Pinus 18-25 cm', 'R$/m3'
            if '25' in key and '35' in key:
                return 'Toras', 'Pinus', 'Toras Pinus 25-35 cm', 'R$/m3'
            if '30' in key and '40' in key:
                return 'Toras', 'Pinus', 'Toras Pinus 25-35 cm', 'R$/m3'
            if '>35' in key or '>40' in key or '40' in key:
                return 'Toras', 'Pinus', 'Toras Pinus > 35 cm', 'R$/m3'
            if 'MEDIA' in key and 'ESTADO' in key:
                return 'Toras', 'Pinus', 'Toras Pinus Media Estado', 'R$/m3'
            return 'Toras', 'Pinus', 'Toras Pinus Geral', 'R$/m3'

        # Toras para processo
        if 'PROCESSO' in key:
            return 'Toras', 'Processo', 'Toras Processo', 'R$/m3'

        # Escoras
        if 'ESCORA' in key or 'OUTRASFINALIDADES' in key:
            return 'Toras', 'Processo', 'Escoras', 'R$/m3'

        # Toras de nativas diversas
        return 'Toras', 'Nativas', 'Toras Outras Especies', 'R$/m3'

    # Lenha -> Energia
    if 'LENHA' in key:
        return 'Energia', 'Lenha', 'Lenha', 'R$/m3'

    # Carvao -> Energia
    if 'CARVAO' in key:
        return 'Energia', 'Carvao', 'Carvao Vegetal', 'R$/kg'

    # Cavacos
    if 'CAVACO' in key:
        if 'SUJO' in key or 'ENERGIA' in key:
            return 'Cavacos', 'Sujo', 'Cavaco Sujo', 'R$/m3'
        return 'Cavacos', 'Limpo', 'Cavaco Limpo', 'R$/m3'

    # PFNM - Erva-mate Folha (producao primaria)
    if 'FOLHA' in key and ('ERVA' in key or 'MATE' in key):
        if 'INDUSTRIA' in key:
            return 'PFNM', 'Erva-mate Folha', 'Erva-mate Folha Industria', 'R$/kg'
        if 'BARRANCO' in key:
            return 'PFNM', 'Erva-mate Folha', 'Erva-mate Folha Barranco', 'R$/kg'
        return 'PFNM', 'Erva-mate Folha', 'Erva-mate Folha Pe', 'R$/kg'

    # PFNM - Palmito (nao muda)
    if 'PALMITO' in key and 'MUDA' not in key:
        return 'PFNM', 'Palmito', 'Palmito Cabeca', 'R$/cabeca'

    # PFNM - Latex
    if 'LATEX' in key or 'SERINGUEIRA' in key:
        return 'PFNM', 'Latex', 'Latex Seringueira', 'R$/kg'

    # PFNM - Pinhao
    if 'PINHAO' in key:
        return 'PFNM', 'Pinhao', 'Pinhao', 'R$/kg'

    # PFNM - Resina
    if 'RESINA' in key:
        return 'PFNM', 'Resina', 'Resina Pinus', 'R$/kg'

    # Nao classificado
    return None, None, None, None


def extract_unit(text):
    """Extrai unidade do texto"""
    if pd.isna(text):
        return None
    raw = str(text)
    norm = unicodedata.normalize('NFKD', raw)
    norm = ''.join(ch for ch in norm if not unicodedata.combining(ch))
    norm = norm.replace('Â³', '3').replace('Â²', '2')
    norm = norm.lower()

    if 'r$/unid' in norm or 'unid' in norm:
        return 'R$/unid'
    if 'r$/arroba' in norm or 'arroba' in norm:
        return 'R$/arroba'
    if 'r$/kg' in norm or '(kg' in norm or ' kg' in norm:
        return 'R$/kg'
    if 'r$/m3' in norm or 'm3' in norm or 'metro cubico' in norm:
        return 'R$/m3'
    if 'r$/t' in norm or 'tonelada' in norm:
        return 'R$/t'
    if 'r$/cabeca' in norm or 'cabeca' in norm:
        return 'R$/cabeca'
    if 'r$/dz' in norm or 'duzia' in norm:
        return 'R$/dz'
    if 'r$/st' in norm or 'estereo' in norm:
        return 'R$/st'
    return None


def parse_price(value):
    """Converte valores numericos com virgula/ponto"""
    if pd.isna(value):
        return None
    raw = str(value).strip()
    if not raw:
        return None
    raw = raw.replace(' ', '')
    if raw.count(',') == 1 and raw.count('.') == 0:
        raw = raw.replace(',', '.')
    else:
        raw = raw.replace('.', '').replace(',', '.')
    try:
        return float(raw)
    except Exception:
        return None


# =============================================================================
# PARSING DE ARQUIVOS EXCEL
# =============================================================================

def parse_matrix_format(df, year, month, filepath):
    """Processa arquivos no formato matriz (produtos na coluna A, regioes no cabecalho)"""
    records = []

    # Encontra a linha de cabecalho com regioes
    header_row = None
    product_col = 0  # Coluna padrao para nome do produto
    for i in range(min(15, len(df))):
        row_vals = [x for x in df.iloc[i].values if not pd.isna(x)]
        if not row_vals:
            continue
        region_count = sum(1 for v in row_vals if normalize_region_name(v))
        if region_count >= 4:  # Pelo menos 4 regioes para confirmar que e cabecalho
            header_row = i
            # Verifica se ha coluna "Produto" explicita (formato 201905)
            for col_idx, val in enumerate(df.iloc[i]):
                if pd.notna(val) and normalize_key(str(val)) == 'PRODUTO':
                    product_col = col_idx
                    break
            break

    if header_row is None:
        return records

    header = df.iloc[header_row]
    region_cols = {}
    unit_col = None

    for col_idx, val in enumerate(header):
        if pd.isna(val):
            continue
        val_str = str(val).strip()
        val_key = normalize_key(val_str)

        # Verifica se e coluna de unidade
        if val_key in ('UNIDADE', 'UNID', 'R$UNID', 'R$M3', 'R$ST', 'R$T'):
            unit_col = col_idx
            continue

        region = normalize_region_name(val_str)
        if region:
            region_cols[col_idx] = region

    if not region_cols:
        return records

    # Processa cada linha de produto
    for i in range(header_row + 1, len(df)):
        row = df.iloc[i]

        # Usa a coluna identificada para o nome do produto
        product_name = row.iloc[product_col] if product_col < len(row) else None
        if pd.isna(product_name):
            continue

        product_name = fix_mojibake(str(product_name).strip())

        # Ignora linhas de cabecalho/categoria/totais
        product_key = normalize_key(product_name)
        skip_patterns = ['FONTE', 'ACOMPANHAMENTO', 'SECRETARIA', 'DEPARTAMENTO',
                         'LEVANTAMENTO', 'REFERENCIA', 'MEDIAESTADO', 'MEDIADOESTADO',
                         'PRECO', 'ESPECIE', 'MUDASPLANTIO', 'PRODUTOSFLORESTAIS',
                         'TORASEM', 'SEMENTESFLORESTAIS', 'PRODUTOSNAO', 'LENHACAVACOS',
                         'MADEIRASERRADA', 'CUSTOSOPERACIONAIS']
        if any(p in product_key for p in skip_patterns):
            continue

        # Ignora linhas muito curtas (provavelmente cabecalhos de secao)
        if len(product_name) < 5:
            continue

        categoria, subcategoria, produto, unidade_padrao = classify_product(product_name)
        if not categoria:
            continue

        # Extrai unidade se disponivel
        unidade = None
        if unit_col is not None and unit_col < len(row):
            unidade = extract_unit(row.iloc[unit_col])
        if not unidade:
            unidade = unidade_padrao

        for col_idx, regiao in region_cols.items():
            if col_idx < len(row):
                preco = row.iloc[col_idx]
                if pd.notna(preco):
                    try:
                        preco_float = float(preco)
                    except:
                        continue
                    if preco_float > 0:
                        records.append({
                            'ano': year,
                            'mes': month,
                            'periodo': f"{year}-{month:02d}",
                            'regiao': regiao,
                            'categoria': categoria,
                            'subcategoria': subcategoria,
                            'produto': produto,
                            'unidade': unidade,
                            'preco': preco_float
                        })

    return records


def parse_modern_excel(filepath, year, month):
    """Processa arquivos Excel modernos (2018+)"""
    records = []

    try:
        if str(filepath).endswith('.ods'):
            df = pd.read_excel(filepath, sheet_name=0, header=None, engine='odf')
        else:
            df = pd.read_excel(filepath, sheet_name=0, header=None)
    except Exception as e:
        print(f"  Erro ao ler {filepath}: {e}")
        return records

    header_row = None
    for i in range(min(10, len(df))):
        row_str = ' '.join([str(x) for x in df.iloc[i].values if not pd.isna(x)])
        if 'Produto' in row_str and 'Apucarana' in row_str:
            header_row = i
            break

    if header_row is None:
        # Tenta formato matriz alternativo
        matrix_records = parse_matrix_format(df, year, month, filepath)
        if matrix_records:
            return matrix_records
        print(f"  Cabecalho nao encontrado em {filepath}")
        return records

    header = df.iloc[header_row]
    region_cols = {}
    for col_idx, val in enumerate(header):
        region = normalize_region_name(val)
        if region:
            region_cols[col_idx] = region

    media_atual_col = None
    for col_idx, val in enumerate(header):
        if pd.notna(val) and 'MEDIAATUAL' in normalize_key(val):
            media_atual_col = col_idx
            break

    for i in range(header_row + 1, len(df)):
        row = df.iloc[i]
        product_name = row.iloc[0]

        if pd.isna(product_name):
            continue

        product_name = fix_mojibake(str(product_name).strip())

        if any(x in product_name.lower() for x in ['mudas plantio', 'produtos florestais', 'toras em', 'secretaria', 'departamento', 'referencia']):
            continue

        categoria, subcategoria, produto, unidade_padrao = classify_product(product_name)
        if not categoria:
            continue

        # Extrai unidade do texto ou usa o padrao
        unidade = extract_unit(row.iloc[1]) if len(row) > 1 else None
        if not unidade:
            unidade = unidade_padrao

        for col_idx, regiao in region_cols.items():
            if col_idx < len(row):
                preco = row.iloc[col_idx]
                if pd.notna(preco) and isinstance(preco, (int, float)) and preco > 0:
                    records.append({
                        'ano': year,
                        'mes': month,
                        'periodo': f"{year}-{month:02d}",
                        'regiao': regiao,
                        'categoria': categoria,
                        'subcategoria': subcategoria,
                        'produto': produto,
                        'unidade': unidade,
                        'preco': float(preco)
                    })

        if media_atual_col is not None and media_atual_col < len(row):
            media = row.iloc[media_atual_col]
            if pd.notna(media) and isinstance(media, (int, float)) and media > 0:
                records.append({
                    'ano': year,
                    'mes': month,
                    'periodo': f"{year}-{month:02d}",
                    'regiao': 'Media Estado',
                    'categoria': categoria,
                    'subcategoria': subcategoria,
                    'produto': produto,
                    'unidade': unidade,
                    'preco': float(media)
                })

    return records


def find_old_header_row(df):
    """Encontra a linha de cabecalho em arquivos antigos"""
    for i in range(min(40, len(df))):
        row_vals = [x for x in df.iloc[i].values if not pd.isna(x)]
        if not row_vals:
            continue
        row_str = ' '.join([str(x) for x in row_vals])
        row_key = normalize_key(row_str)
        region_hits = 0
        for val in row_vals:
            if normalize_region_name(val):
                region_hits += 1
        has_label = 'ESPECIE' in row_key or 'PRODUTO' in row_key
        if region_hits >= 3 and (has_label or region_hits >= 4):
            return i
    return None


def parse_long_format_sheet(df, sheet_name, filename):
    """Processa planilhas no formato longo (com datas como colunas)"""
    if df is None or df.empty:
        return []
    header = df.iloc[0]
    date_cols = {}
    for col_idx, val in enumerate(header):
        dt = pd.to_datetime(val, errors='coerce')
        if pd.notna(dt):
            date_cols[col_idx] = dt

    if not date_cols:
        return []

    region_col = None
    product_col = None
    for col_idx, val in enumerate(header):
        key = normalize_key(val)
        if key in ('NR', 'NRE', 'NUCLEOREGIONAL'):
            region_col = col_idx
        if key == 'NOMECOMPLETO':
            product_col = col_idx

    if region_col is None or product_col is None:
        return []

    records = []
    for i in range(1, len(df)):
        row = df.iloc[i]
        region = normalize_region_name(row.iloc[region_col])
        if not region:
            continue
        product_name = fix_mojibake(row.iloc[product_col])
        if pd.isna(product_name) or not str(product_name).strip():
            continue
        product_name = fix_mojibake(str(product_name).strip())

        categoria, subcategoria, produto, unidade = classify_product(product_name)
        if not categoria:
            continue

        for col_idx, dt in date_cols.items():
            if col_idx < len(row):
                preco = row.iloc[col_idx]
                if pd.notna(preco):
                    try:
                        preco_float = float(preco)
                    except:
                        continue
                    if preco_float > 0:
                        records.append({
                            'ano': dt.year,
                            'mes': dt.month,
                            'periodo': f"{dt.year}-{dt.month:02d}",
                            'regiao': region,
                            'categoria': categoria,
                            'subcategoria': subcategoria,
                            'produto': produto,
                            'unidade': unidade,
                            'preco': preco_float
                        })

    return records


def parse_old_sheet(df, year, month, sheet_name, filename):
    """Processa planilhas antigas"""
    records = []

    long_records = parse_long_format_sheet(df, sheet_name, filename)
    if long_records:
        return long_records

    header_row = find_old_header_row(df)
    if header_row is None:
        print(f"  Cabecalho nao encontrado em {filename} ({sheet_name})")
        return records

    header = df.iloc[header_row]
    region_cols = {}
    for col_idx, val in enumerate(header):
        region = normalize_region_name(val)
        if region:
            region_cols[col_idx] = region

    if not region_cols:
        print(f"  Nenhuma regiao encontrada em {filename} ({sheet_name})")
        return records

    for i in range(header_row + 1, len(df)):
        row = df.iloc[i]
        product_cells = []
        for j in range(min(2, len(row))):
            if pd.notna(row.iloc[j]) and str(row.iloc[j]).strip():
                product_cells.append(str(row.iloc[j]).strip())
        if not product_cells:
            continue

        product_name = fix_mojibake(product_cells[0])
        if len(product_cells) > 1 and product_cells[1] not in product_name:
            product_name = f"{product_name} - {product_cells[1]}"

        product_key = normalize_key(product_name)
        if (product_key.startswith('FONTE') or 'ACOMPANHAMENTO' in product_key
                or 'PRECO' in product_key or 'ESPECIE' in product_key):
            continue

        categoria, subcategoria, produto, unidade = classify_product(product_name)
        if not categoria:
            continue

        for col_idx, regiao in region_cols.items():
            if col_idx < len(row):
                preco = row.iloc[col_idx]
                if pd.notna(preco):
                    try:
                        preco_float = float(preco)
                    except:
                        continue
                    if preco_float > 0:
                        records.append({
                            'ano': year,
                            'mes': month,
                            'periodo': f"{year}-{month:02d}",
                            'regiao': regiao,
                            'categoria': categoria,
                            'subcategoria': subcategoria,
                            'produto': produto,
                            'unidade': unidade,
                            'preco': preco_float
                        })

    return records


def parse_old_excel(filepath, year, month):
    """Processa arquivos Excel antigos"""
    records = []

    try:
        try:
            xl = pd.ExcelFile(filepath)
        except:
            xl = pd.ExcelFile(filepath, engine='xlrd')
    except Exception as e:
        print(f"  Erro ao ler {filepath}: {e}")
        return records

    for sheet_name in xl.sheet_names:
        try:
            try:
                df = pd.read_excel(filepath, sheet_name=sheet_name, header=None)
            except:
                df = pd.read_excel(filepath, sheet_name=sheet_name, header=None, engine='xlrd')
        except Exception as e:
            print(f"  Erro ao ler {filepath} ({sheet_name}): {e}")
            continue

        records.extend(parse_old_sheet(df, year, month, sheet_name, filepath.name))

    return records


# =============================================================================
# PROCESSAMENTO DE PDF
# =============================================================================

def parse_pdf(filepath, year, month):
    """Processa arquivos PDF com tabelas"""
    records = []

    if pdfplumber is None:
        print(f"  pdfplumber nao instalado - ignorando {filepath.name}")
        return records

    def parse_pdf_table(table):
        if not table or len(table) < 2:
            return []

        regions = [r for r in REGIOES if r != 'Pitanga'] + ['Media Estado']
        out = []
        for row in table[1:]:
            if not row or len(row) < 2:
                continue
            product_name = row[0]
            if pd.isna(product_name) or not str(product_name).strip():
                continue
            product_name = fix_mojibake(str(product_name).strip())

            categoria, subcategoria, produto, unidade_padrao = classify_product(product_name)
            if not categoria:
                continue

            unidade = extract_unit(row[1]) if len(row) > 1 else None
            if not unidade:
                unidade = unidade_padrao

            max_cols = min(len(regions), len(row) - 2)
            for i in range(max_cols):
                preco = parse_price(row[i + 2])
                if preco is None or preco <= 0:
                    continue
                out.append({
                    'ano': year,
                    'mes': month,
                    'periodo': f"{year}-{month:02d}",
                    'regiao': regions[i],
                    'categoria': categoria,
                    'subcategoria': subcategoria,
                    'produto': produto,
                    'unidade': unidade,
                    'preco': preco
                })
        return out

    try:
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables() or []
                for table in tables:
                    records.extend(parse_pdf_table(table))
    except Exception as e:
        print(f"  Erro ao ler {filepath}: {e}")

    return records


# =============================================================================
# PROCESSAMENTO PRINCIPAL
# =============================================================================

def process_all_files():
    """Processa todos os arquivos de entrada"""
    all_records = []

    extensions = ['.xlsx', '.xls', '.ods', '.pdf']
    files = []
    for ext in extensions:
        files.extend(DATA_DIR.glob(f'*{ext}'))

    # Exclui o arquivo de produtos
    files = [f for f in files if 'products_all_years' not in f.name.lower()]

    print(f"Encontrados {len(files)} arquivos para processar")

    for filepath in sorted(files):
        filename = filepath.name
        year, month = extract_date_from_filename(filename)

        if not year:
            print(f"  Ignorando {filename} - nao foi possivel extrair data")
            continue

        print(f"Processando {filename} ({year}-{month:02d})...")

        if filepath.suffix.lower() == '.pdf':
            records = parse_pdf(filepath, year, month)
        elif year >= 2018 or 'compilacao' in filename.lower() or 'compilação' in filename.lower():
            records = parse_modern_excel(filepath, year, month)
        else:
            records = parse_old_excel(filepath, year, month)

        print(f"  -> {len(records)} registros extraidos")
        all_records.extend(records)

    return all_records


def generate_aggregations(records):
    """Gera agregacoes dos dados"""
    df = pd.DataFrame(records)

    if df.empty:
        return {}

    periodos = sorted(df['periodo'].unique().tolist())
    anos = sorted(df['ano'].unique().tolist())
    regioes = sorted(df['regiao'].unique().tolist())
    categorias = sorted(df['categoria'].unique().tolist())

    subcategorias = {}
    for cat in categorias:
        subcategorias[cat] = sorted(df[df['categoria'] == cat]['subcategoria'].unique().tolist())

    produtos = {}
    for cat in categorias:
        produtos[cat] = {}
        for subcat in subcategorias.get(cat, []):
            produtos[cat][subcat] = sorted(
                df[(df['categoria'] == cat) & (df['subcategoria'] == subcat)]['produto'].unique().tolist()
            )

    stats = {
        'total_registros': len(df),
        'periodo_inicio': periodos[0] if periodos else f"{min(anos)}-01",
        'periodo_fim': periodos[-1] if periodos else f"{max(anos)}-12",
        'total_anos': len(anos),
        'total_regioes': len([r for r in regioes if r != 'Media Estado']),
        'total_categorias': len(categorias),
        'total_produtos': df['produto'].nunique()
    }

    ultimo_periodo = df['periodo'].max()
    df_ultimo = df[df['periodo'] == ultimo_periodo]
    precos_medios = df_ultimo.groupby('categoria')['preco'].mean().to_dict()

    return {
        'anos': anos,
        'regioes': regioes,
        'categorias': categorias,
        'subcategorias': subcategorias,
        'produtos': produtos,
        'stats': stats,
        'precos_medios_ultimo': precos_medios,
        'ultimo_periodo': ultimo_periodo
    }


def generate_nomenclature_review(records):
    """Gera planilha de combinacoes para padronizacao manual"""
    df = pd.DataFrame(records)
    if df.empty:
        return

    cols = ['ano', 'categoria', 'subcategoria', 'produto', 'unidade']
    review = df[cols].drop_duplicates().sort_values(cols)
    output_path = BASE_DIR / "nomenclatura_revisao.xlsx"

    try:
        review.to_excel(output_path, index=False)
        print(f"  -> nomenclatura_revisao.xlsx ({len(review)} linhas)")
    except Exception as e:
        fallback = BASE_DIR / "nomenclatura_revisao.csv"
        review.to_csv(fallback, index=False, encoding='utf-8')
        print(f"  -> nomenclatura_revisao.csv ({len(review)} linhas) - {e}")


def main():
    print("=" * 60)
    print("Preprocessamento de Precos Florestais - DERAL/SEAB PR")
    print("Versao 2025 - Mapeamento Integrado")
    print("=" * 60)

    records = process_all_files()

    if not records:
        print("Nenhum registro encontrado!")
        return

    print(f"\nTotal de {len(records)} registros processados")

    print("\nGerando agregacoes...")
    aggregations = generate_aggregations(records)

    print("\nGerando planilha de nomenclatura...")
    generate_nomenclature_review(records)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("\nSalvando arquivos JSON...")
    with open(OUTPUT_DIR / 'detailed.json', 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=None)
    print(f"  -> detailed.json ({len(records)} registros)")

    with open(OUTPUT_DIR / 'aggregated.json', 'w', encoding='utf-8') as f:
        json.dump(aggregations, f, ensure_ascii=False, indent=2)
    print("  -> aggregated.json")

    print("\n" + "=" * 60)
    print("RESUMO")
    print("=" * 60)
    print(f"Total de registros: {len(records)}")
    print(f"Periodo: {aggregations.get('stats', {}).get('periodo_inicio', '?')} a {aggregations.get('stats', {}).get('periodo_fim', '?')}")
    print(f"Anos: {aggregations.get('stats', {}).get('total_anos', 0)}")
    print(f"Regioes: {aggregations.get('stats', {}).get('total_regioes', 0)}")
    print(f"Categorias: {aggregations.get('stats', {}).get('total_categorias', 0)}")
    print(f"Produtos unicos: {aggregations.get('stats', {}).get('total_produtos', 0)}")

    # Mostra categorias e produtos
    print("\nCATEGORIAS E PRODUTOS:")
    for cat in sorted(aggregations.get('categorias', [])):
        print(f"\n  {cat}:")
        for subcat in sorted(aggregations.get('subcategorias', {}).get(cat, [])):
            prods = aggregations.get('produtos', {}).get(cat, {}).get(subcat, [])
            print(f"    {subcat}: {', '.join(sorted(prods))}")

    print("\nProcessamento concluido!")


if __name__ == '__main__':
    main()

