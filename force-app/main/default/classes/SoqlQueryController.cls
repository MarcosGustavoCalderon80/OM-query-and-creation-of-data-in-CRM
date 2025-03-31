public with sharing class SoqlQueryController {
    @AuraEnabled(cacheable=true)
    public static Map<String, List<String>> getObjectFields(String objectName) {
        Map<String, List<String>> fieldMap = new Map<String, List<String>>();
        try {
            // Limpiar el nombre del objeto
            objectName = objectName.trim();
            if (objectName.endsWith(';')) {
                objectName = objectName.substring(0, objectName.length() - 1);
            }
            
            Schema.SObjectType objectType = Schema.getGlobalDescribe().get(objectName);
            if (objectType == null) {
                throw new AuraHandledException('Objeto no válido: ' + objectName);
            }
            
            Map<String, Schema.SObjectField> fieldsMap = objectType.getDescribe().fields.getMap();
            List<String> fieldNames = new List<String>();
            
            // Campos directos del objeto
            for (String fieldName : fieldsMap.keySet()) {
                Schema.DescribeFieldResult fieldDescribe = fieldsMap.get(fieldName).getDescribe();
                if (fieldDescribe.isAccessible()) {
                    fieldNames.add(fieldDescribe.getName());
                    
                    // Si es un campo de relación, obtener los campos relacionados
                    if (fieldDescribe.getType() == Schema.DisplayType.REFERENCE) {
                        List<Schema.SObjectType> referenceTo = fieldDescribe.getReferenceTo();
                        if (!referenceTo.isEmpty()) {
                            String relationshipName = fieldDescribe.getRelationshipName();
                            if (relationshipName != null) {
                                // Usar el nombre de relación en formato estándar
                                String relationField = relationshipName.endsWith('__r') 
                                    ? relationshipName.replace('__r', '__c') 
                                    : relationshipName.endsWith('_r') 
                                        ? relationshipName.replace('_r', '_c') 
                                        : relationshipName + 'Id';
                                
                                Schema.SObjectType relatedObject = referenceTo[0];
                                Map<String, Schema.SObjectField> relatedFields = relatedObject.getDescribe().fields.getMap();
                                List<String> relatedFieldNames = new List<String>();
                                
                                for (String relatedField : relatedFields.keySet()) {
                                    Schema.DescribeFieldResult relatedFieldDescribe = relatedFields.get(relatedField).getDescribe();
                                    if (relatedFieldDescribe.isAccessible() && 
                                        !relatedFieldDescribe.isCalculated() && 
                                        !relatedFieldDescribe.isAutoNumber()) {
                                        // Formato: RelationField.FieldName
                                        relatedFieldNames.add(relationField + '.' + relatedFieldDescribe.getName());
                                    }
                                }
                                
                                if (!relatedFieldNames.isEmpty()) {
                                    fieldMap.put(relationField, relatedFieldNames);
                                }
                            }
                        }
                    }
                }
            }
            
            // Campos del objeto principal
            fieldMap.put(objectName, fieldNames);
            return fieldMap;
        } catch (Exception e) {
            throw new AuraHandledException('Error al obtener los campos: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=false)
    public static List<sObject> executeQuery(String query) {
        try {
            // Validación básica de seguridad
            if (query.containsIgnoreCase('password__c') || 
                query.containsIgnoreCase('credit_card__c') || 
                query.toLowerCase().contains('from user where')) {
                throw new AuraHandledException('Consulta no permitida por razones de seguridad');
            }
            
            // Limitar el número de registros para evitar sobrecarga
            if (!query.toLowerCase().contains('limit ') && !query.toLowerCase().contains('count()')) {
                query += ' LIMIT 200';
            }
            
            List<sObject> result = Database.query(query);
            return result;
        } catch (Exception e) {
            throw new AuraHandledException('Error en la consulta: ' + e.getMessage());
        }
    }
}