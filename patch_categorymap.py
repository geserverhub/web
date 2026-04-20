#\!/usr/bin/env python3
# -*- coding: utf-8 -*-
filepath = '/home/pavinee/GE/src/app/admin/clients/ClientsUsersClient.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

KRW_CM = (
    '      categoryMap: { '
    '"\\u0e04\\u0e48\\u0e32\\u0e40\\u0e0a\\u0e48\\u0e32\\u0e40\\u0e0b\\u0e34\\u0e23\\u0e4c\\u0e1f\\u0e40\\u0e27\\u0e2d\\u0e23\\u0e4c/\\u0e42\\u0e14\\u0e40\\u0e21\\u0e19": "\\uc11c\\ubc84/\\ub3c4\\uba54\\uc778 \\uc784\\ub300\\ub8cc", '
    '"\\u0e04\\u0e48\\u0e32\\u0e1a\\u0e23\\u0e34\\u0e01\\u0e32\\u0e23\\u0e20\\u0e32\\u0e22\\u0e19\\u0e2d\\u0e01": "\\uc678\\ubd80 \\uc11c\\ube44\\uc2a4 \\ube44\\uc6a9", '
    '"\\u0e04\\u0e48\\u0e32\\u0e08\\u0e49\\u0e32\\u0e07\\u0e1e\\u0e19\\u0e31\\u0e01\\u0e07\\u0e32\\u0e19": "\\uc9c1\\uc6d0 \\uae09\\uc5ec", '
    '"\\u0e04\\u0e48\\u0e32\\u0e43\\u0e0a\\u0e49\\u0e08\\u0e48\\u0e32\\u0e22\\u0e2a\\u0e33\\u0e19\\u0e31\\u0e01\\u0e07\\u0e32\\u0e19": "\\uc0ac\\ubb34\\uc2e4 \\ube44\\uc6a9", '
    '"\\u0e04\\u0e48\\u0e32\\u0e02\\u0e19\\u0e2a\\u0e48\\u0e07": "\\uc6b4\\uc1a1\\ube44", '
    '"\\u0e04\\u0e48\\u0e32\\u0e27\\u0e31\\u0e2a\\u0e14\\u0e38": "\\uc790\\uc7ac\\ube44", '
    '"\\u0e04\\u0e48\\u0e32\\u0e42\\u0e06\\u0e29\\u0e13\\u0e32": "\\uad11\\uace0\\ube44", '
    '"\\u0e2d\\u0e37\\u0e48\\u0e19\\u0e46": "\\uae30\\ud0c0" },\n'
)

USD_CM = (
    '      categoryMap: { '
    '"\\u0e04\\u0e48\\u0e32\\u0e40\\u0e0a\\u0e48\\u0e32\\u0e40\\u0e0b\\u0e34\\u0e23\\u0e4c\\u0e1f\\u0e40\\u0e27\\u0e2d\\u0e23\\u0e4c/\\u0e42\\u0e14\\u0e40\\u0e21\\u0e19": "Server/Domain Rental", '
    '"\\u0e04\\u0e48\\u0e32\\u0e1a\\u0e23\\u0e34\\u0e01\\u0e32\\u0e23\\u0e20\\u0e32\\u0e22\\u0e19\\u0e2d\\u0e01": "External Service Fee", '
    '"\\u0e04\\u0e48\\u0e32\\u0e08\\u0e49\\u0e32\\u0e07\\u0e1e\\u0e19\\u0e31\\u0e01\\u0e07\\u0e32\\u0e19": "Employee Wages", '
    '"\\u0e04\\u0e48\\u0e32\\u0e43\\u0e0a\\u0e49\\u0e08\\u0e48\\u0e32\\u0e22\\u0e2a\\u0e33\\u0e19\\u0e31\\u0e01\\u0e07\\u0e32\\u0e19": "Office Expenses", '
    '"\\u0e04\\u0e48\\u0e32\\u0e02\\u0e19\\u0e2a\\u0e48\\u0e07": "Transport", '
    '"\\u0e04\\u0e48\\u0e32\\u0e27\\u0e31\\u0e2a\\u0e14\\u0e38": "Materials", '
    '"\\u0e04\\u0e48\\u0e32\\u0e42\\u0e06\\u0e29\\u0e13\\u0e32": "Advertising", '
    '"\\u0e2d\\u0e37\\u0e48\\u0e19\\u0e46": "Others" },\n'
)

THB_CM = '      categoryMap: {},\n'

errors = []

KRW_OLD = '"\\u0e22\\u0e01\\u0e40\\u0e25\\u0e34\\u0e01": "\\ucd94\\uc18c" },\n    } : currency === "USD" ? {'
KRW_NEW = '"\\u0e22\\u0e01\\u0e40\\u0e25\\u0e34\\u0e01": "\\ucd94\\uc18c" },\n' + KRW_CM + '    } : currency === "USD" ? {'
if KRW_OLD not in content:
    errors.append('KRW marker NOT found')
else:
    content = content.replace(KRW_OLD, KRW_NEW, 1)
    print('OK: KRW categoryMap inserted')

USD_OLD = '"\\u0e22\\u0e01\\u0e40\\u0e25\\u0e34\\u0e01": "Cancelled" },\n    } : {'
USD_NEW = '"\\u0e22\\u0e01\\u0e40\\u0e25\\u0e34\\u0e01": "Cancelled" },\n' + USD_CM + '    } : {'
if USD_OLD not in content:
    errors.append('USD marker NOT found')
else:
    content = content.replace(USD_OLD, USD_NEW, 1)
    print('OK: USD categoryMap inserted')

THB_OLD = 'CANCELLED: "\\u0e22\\u0e01\\u0e40\\u0e25\\u0e34\\u0e01" },\n    };'
THB_NEW = 'CANCELLED: "\\u0e22\\u0e01\\u0e40\\u0e25\\u0e34\\u0e01" },\n' + THB_CM + '    };'
if THB_OLD not in content:
    errors.append('THB marker NOT found')
else:
    content = content.replace(THB_OLD, THB_NEW, 1)
    print('OK: THB categoryMap inserted')

DESC_OLD = 'desc: e.category, detail: L.statusMap[e.status]'
DESC_NEW = 'desc: L.categoryMap[e.category] || e.category, detail: L.statusMap[e.status]'
if DESC_OLD not in content:
    errors.append('desc marker NOT found')
else:
    content = content.replace(DESC_OLD, DESC_NEW, 1)
    print('OK: expense desc updated')

if errors:
    print('ERRORS:', errors)
    exit(1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('File written successfully.')
