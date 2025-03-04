public with sharing class PicklistController {

    @AuraEnabled(cacheable=true)
    public static List<String> getPicklistValues(String objectName, String fieldName) {
        List<String> picklistValues = new List<String>();
        Schema.DescribeFieldResult fieldResult = Schema.getGlobalDescribe().get(objectName).getDescribe().fields.getMap().get(fieldName).getDescribe();
        List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();

        for (Schema.PicklistEntry entry : picklistEntries) {
            if (entry.isActive()) {
                picklistValues.add(entry.getValue());
            }
        }
        return picklistValues;
    }
}
