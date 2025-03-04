public class SoqlQueryController {
    @AuraEnabled(cacheable=true)
    public static List<String> getObjectFields(String objectName) {
        List<String> fieldNames = new List<String>();
        try {
            Schema.SObjectType objectType = Schema.getGlobalDescribe().get(objectName);
            if (objectType == null) {
                throw new AuraHandledException('Objeto no válido: ' + objectName);
            }
            Map<String, Schema.SObjectField> fieldsMap = objectType.getDescribe().fields.getMap();
            for (String fieldName : fieldsMap.keySet()) {
                fieldNames.add(fieldName);
            }
            return fieldNames;
        } catch (Exception e) {
            throw new AuraHandledException('Error al obtener los campos: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=false)
    public static List<sObject> executeQuery(String query) {
        try {
            List<sObject> result = Database.query(query);
            return result;
        } catch (Exception e) {
            throw new AuraHandledException('Error en la consulta: ' + e.getMessage());
        }
    }
}