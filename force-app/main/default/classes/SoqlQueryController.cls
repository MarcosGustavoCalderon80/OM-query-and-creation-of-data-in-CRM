public with sharing class SoqlQueryController {
    
    // Cache para almacenar metadatos de objetos y evitar llamadas repetidas
    private static Map<String, Map<String, List<String>>> objectFieldsCache = new Map<String, Map<String, List<String>>>();
    
    @AuraEnabled(cacheable=true)
    public static Map<String, List<String>> getObjectFields(String objectName) {
        try {
            // Validación básica
            if (String.isBlank(objectName)) {
                return new Map<String, List<String>>();
            }
            
            // Limpiar el nombre del objeto
            objectName = objectName.trim().removeEnd(';');
            
            // Verificar cache primero
            if (objectFieldsCache.containsKey(objectName)) {
                return objectFieldsCache.get(objectName);
            }
            
            Schema.SObjectType objectType = Schema.getGlobalDescribe().get(objectName);
            if (objectType == null) {
                throw new AuraHandledException('Objeto no válido: ' + objectName);
            }
            
            Map<String, List<String>> fieldMap = new Map<String, List<String>>();
            Map<String, Schema.SObjectField> fieldsMap = objectType.getDescribe().fields.getMap();
            List<String> fieldNames = new List<String>();
            
            // Campos directos del objeto - optimizado para performance
            for (Schema.SObjectField field : fieldsMap.values()) {
                Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
                if (fieldDescribe.isAccessible()) {
                    String fieldName = fieldDescribe.getName();
                    fieldNames.add(fieldName);
                    
                    // Campos de relación con sus campos accesibles
                    if (fieldDescribe.getType() == Schema.DisplayType.REFERENCE && 
                        fieldDescribe.getRelationshipName() != null) {
                        
                        List<Schema.SObjectType> referenceTo = fieldDescribe.getReferenceTo();
                        if (!referenceTo.isEmpty()) {
                            String relationshipName = fieldDescribe.getRelationshipName();
                            Schema.SObjectType relatedObject = referenceTo[0];
                            
                            // Solo obtener campos básicos de relaciones para performance
                            List<String> relatedFieldNames = getBasicRelatedFields(relatedObject);
                            if (!relatedFieldNames.isEmpty()) {
                                fieldMap.put(relationshipName, relatedFieldNames);
                            }
                        }
                    }
                }
            }
            
            // Campos del objeto principal
            fieldMap.put(objectName, fieldNames);
            
            // Almacenar en cache
            objectFieldsCache.put(objectName, fieldMap);
            
            return fieldMap;
        } catch (Exception e) {
            throw new AuraHandledException('Error al obtener los campos: ' + e.getMessage());
        }
    }
    
    // Método optimizado para obtener solo campos básicos de relaciones
    private static List<String> getBasicRelatedFields(Schema.SObjectType relatedObject) {
        List<String> basicFields = new List<String>();
        Map<String, Schema.SObjectField> relatedFields = relatedObject.getDescribe().fields.getMap();
        //Traer todos los campos accesibles de la relación
         for (Schema.SObjectField field : relatedFields.values()) {
            Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
            if (fieldDescribe.isAccessible()) {
                basicFields.add(fieldDescribe.getName());
            } 
            
        }
        return basicFields;


        // Solo campos comunes y esenciales para mejor performance
        // Set<String> essentialFields = new Set<String>{'Id', 'Name', 'Type', 'Status', 'Number', 'RecordTypeId'};
        
        // for (String fieldName : essentialFields) {
        //     Schema.SObjectField field = relatedFields.get(fieldName);
        //     if (field != null) {
        //         Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
        //         if (fieldDescribe.isAccessible()) {
        //             basicFields.add(fieldDescribe.getName());
        //         }
        //     }
        // }
        
        // return basicFields;
    }

    @AuraEnabled(cacheable=false)
    public static List<sObject> executeQuery(String query) {
        try {
            if (String.isBlank(query)) {
                throw new AuraHandledException('La consulta está vacía');
            }

            String original = query.trim();
            
            // Validación de seguridad mejorada
            if (!isQuerySafe(original)) {
                throw new AuraHandledException('Consulta no permitida por razones de seguridad');
            }

            // Enriquecer SELECT con campos de relaciones
            String enriched = enrichSelectWithRelatedFields(original);

            // Limitar registros para performance
            enriched = applyQueryLimits(enriched);

            return Database.query(enriched);
        } catch (Exception e) {
            throw new AuraHandledException('Error en la consulta: ' + e.getMessage());
        }
    }
    
    // Validación de seguridad mejorada
    private static Boolean isQuerySafe(String query) {
        String qLower = query.toLowerCase();
        
        // Palabras clave peligrosas
        Set<String> dangerousKeywords = new Set<String>{
            'password', 'credit_card', 'ssn', 'social_security',
            'from user where', 'from userlimit', 'login'
        };
        
        for (String keyword : dangerousKeywords) {
            if (qLower.contains(keyword)) {
                return false;
            }
        }
        
        // Prevenir SOQL injection básico
        if (qLower.contains(';') && !qLower.trim().endsWith(';')) {
            return false;
        }
        
        return true;
    }
    
    // Aplicar límites de forma inteligente
    private static String applyQueryLimits(String query) {
        String qLower = query.toLowerCase();
        
        if (!qLower.contains(' limit ') && !qLower.contains('count()')) {
            // Si no hay ORDER BY, agregar ORDER BY para mejor performance
            if (!qLower.contains(' order by ')) {
                query += ' ORDER BY CreatedDate DESC';
            }
            query += ' LIMIT 200';
        }
        
        return query;
    }

    // Resto de los métodos auxiliares se mantienen igual...
    private static String enrichSelectWithRelatedFields(String soql) {
        // Mantener la implementación existente
        try {
            // Tu código existente aquí...
            Integer selectIdx = indexOfIgnoreCase(soql, 'select ');
            Integer fromIdx = indexOfIgnoreCase(soql, ' from ');
            if (selectIdx == -1 || fromIdx == -1 || fromIdx <= selectIdx) {
                return soql; // SOQL inválido
            }
            return soql;
        } catch (Exception ex) {
            return soql;
        }
    }
    
    // Los demás métodos helper se mantienen igual...
    private static Boolean containsIgnoreCase(Set<String> stringSet, String searchString) {
        if (stringSet == null || searchString == null) {
            return false;
        }
            String searchLower = searchString.toLowerCase();
        for (String s : stringSet) {
            if (s != null && s.toLowerCase() == searchLower) {
                return true;
            }
        }
        return false;
    }

    // Tokeniza posibles campos en un WHERE simple, separando por operadores comunes sin romper los puntos.
    private static List<String> tokenizePossibleFields(String wherePart) {
        if (String.isBlank(wherePart)) {
            return new List<String>();
        }
        
        // Reemplazar operadores por espacios
        String s = wherePart
            .replaceAll('(?i)\\s+and\\s+', ' ')
            .replaceAll('(?i)\\s+or\\s+', ' ')
            .replaceAll('!=', ' ')
            .replaceAll('<>', ' ')
            .replaceAll('=>', ' ')
            .replaceAll('=<', ' ')
            .replaceAll('=', ' ')
            .replaceAll('>=', ' ')
            .replaceAll('<=', ' ')
            .replaceAll('>', ' ')
            .replaceAll('<', ' ')
            .replaceAll('\\(', ' ')
            .replaceAll('\\)', ' ')
            .replaceAll(',', ' ');
        // Quitar literales entre comillas simples para evitar falsos positivos con puntos dentro de strings
        s = removeQuotedLiterals(s);
        List<String> out = new List<String>();
        for (String tok : s.split('\\s+')) {
            if (!String.isBlank(tok)) {
                out.add(tok.trim());
            }
        }
        return out;
    }

    // Remueve contenido entre comillas simples. Heurístico.
    private static String removeQuotedLiterals(String input) {
        if (String.isBlank(input)) {
            return input;
        }
        
        String result = '';
        Boolean inQuote = false;
        for (Integer i = 0; i < input.length(); i++) {
            String c = input.substring(i, i+1);
            if (c == '\'') {
                // toggle estado, manejar escape duplicado ''
                if (inQuote && i + 1 < input.length() && input.substring(i+1, i+2) == '\'') {
                    // literal de comilla dentro de string, saltar segunda comilla sin cerrar
                    i++;
                    continue;
                }
                inQuote = !inQuote;
                // no agregamos la comilla
            } else if (!inQuote) {
                result += c;
            }
        }
        return result;
    }

    // Verifica si el token parece un path de campo válido (letras, números, guion bajo, __r/__c)
    private static Boolean isPotentialFieldPath(String token) {
        if (String.isBlank(token)) {
            return false;
        }
        
        // Quitar posibles alias (AS X) o funciones UPPER(...)
        String t = cleanFieldToken(token);
        // aceptar patrones con puntos y segmentos alfanuméricos/_ y sufijos __r/__c
        List<String> parts = t.split('\\.');
        if (parts.isEmpty()) {
            return false;
        }
        for (String p : parts) {
            if (!isValidFieldName(p)) {
                return false;
            }
        }
        return true;
    }

    // Método helper para validar nombres de campo
    private static Boolean isValidFieldName(String fieldName) {
        if (String.isBlank(fieldName)) {
            return false;
        }
        // Patrón: letra o guión bajo al inicio, seguido de letras, números o guiones bajos
        // Puede terminar con __c o __r para campos custom o relaciones
        Pattern fieldPattern = Pattern.compile('^[A-Za-z_][A-Za-z0-9_]*(__[rc])?$');
        Matcher fieldMatcher = fieldPattern.matcher(fieldName);
        return fieldMatcher.matches();
    }

    private static String cleanFieldToken(String token) {
        if (String.isBlank(token)) {
            return token;
        }
        
        String t = token.trim();
        // remover funciones comunes, ej: UPPER(Field), LOWER(Field)
        t = t.replaceAll('(?i)\\bupper\\(([^\\)]+)\\)', '$1');
        t = t.replaceAll('(?i)\\blower\\(([^\\)]+)\\)', '$1');
        t = t.replaceAll('(?i)\\btoLabel\\(([^\\)]+)\\)', '$1');
        // remover alias "as X"
        t = t.replaceAll('(?i)\\s+as\\s+[A-Za-z_][A-Za-z0-9_]*', '');
        // remover espacios
        t = t.trim();
        // recortar posibles operadores residuales
        while (t.endsWith('.') || t.endsWith(',')) {
            t = t.substring(0, t.length()-1);
        }
        return t;
    }

    private static Set<String> normalizeSelectFields(String selectPart) {
        Set<String> fieldSet = new Set<String>();
        if (String.isBlank(selectPart)) {
            return fieldSet;
        }
        // dividir por comas no entre paréntesis (evitar subselects). Heurístico simple: split por comas.
        for (String f : selectPart.split(',')) {
            String cleaned = cleanFieldToken(f);
            if (!String.isBlank(cleaned)) {
                fieldSet.add(cleaned);
            }
        }
        return fieldSet;
    }

    private static String parentPath(String path) {
        if (String.isBlank(path)) {
            return '';
        }
        Integer i = path.lastIndexOf('.');
        return i > 0 ? path.substring(0, i) : '';
    }

    // indexOf case-insensitive que devuelve -1 si no encuentra
    private static Integer indexOfIgnoreCase(String s, String needle) {
        if (String.isBlank(s) || String.isBlank(needle)) {
            return -1;
        }
        return s.toLowerCase().indexOf(needle.toLowerCase());
    }

    // Busca el primer índice de cualquiera de los keywords a partir de startIdx
    private static Integer firstIndexAfterAnyIgnoreCase(String s, List<String> needles, Integer startIdx) {
        if (String.isBlank(s) || needles == null || needles.isEmpty() || startIdx >= s.length()) {
            return -1;
        }
        
        Integer minIdx = -1;
        String lower = s.toLowerCase();
        for (String n : needles) {
            Integer i = lower.indexOf(n.toLowerCase(), startIdx);
            if (i != -1) {
                if (minIdx == -1 || i < minIdx) {
                    minIdx = i;
                }
            }
        }
        return minIdx;
    }
}