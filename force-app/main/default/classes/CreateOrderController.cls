public with sharing class CreateOrderController {

    @AuraEnabled
    public static Order createOrder(String accountId, String orderName, String gestion, String subGestion, String deliveryMethod, String newAccountName, String effectiveDate) {
        // Si el accountId está vacío, creamos una nueva cuenta
        if (String.isEmpty(accountId)) {
            if (String.isEmpty(newAccountName)) {
                throw new AuraHandledException('Se debe proporcionar un nombre para la nueva cuenta o un ID valido de cuanta exisitente.');
            }
            // Crear la nueva cuenta con el nombre proporcionado
            Account newAccount = new Account(Name = newAccountName);
            try {
                insert newAccount;
                accountId = newAccount.Id; 
                System.debug(LoggingLevel.INFO, 'Cuenta creada con ID: ' + accountId); 
            } catch (Exception e) {
                throw new AuraHandledException('Error al crear la cuenta: ' + e.getMessage());
            }
        }

        // Obtener la descripción del objeto 'Order'
        Schema.DescribeSObjectResult orderDescribe = Order.SObjectType.getDescribe();

        // Obtener la descripción del campo 'Gestion__c'
        Schema.DescribeFieldResult gestionFieldDescribe = orderDescribe.fields.getMap().get('Gestion__c').getDescribe();
        if (gestionFieldDescribe.getType() != Schema.DisplayType.PICKLIST) {
            throw new AuraHandledException('El campo Gestion__c no es un picklist.');
        }

        // Obtener los valores del picklist 'Gestion__c'
        List<Schema.PicklistEntry> gestionPicklistEntries = gestionFieldDescribe.getPicklistValues();
        Boolean isValidGestion = false;

        // Verificar si el valor de 'gestion' es válido
        for (Schema.PicklistEntry entry : gestionPicklistEntries) {
            if (entry.getValue().trim().equalsIgnoreCase(gestion.trim())) {
                isValidGestion = true;
                break;
            }
        }

        if (!isValidGestion) {
            throw new AuraHandledException('El valor "' + gestion + '" no es válido para el campo Gestión.');
        }

        // Obtener la descripción del campo 'SubGestion__c'
        Schema.DescribeFieldResult subGestionFieldDescribe = orderDescribe.fields.getMap().get('SubGestion__c').getDescribe();
        if (subGestionFieldDescribe.getType() != Schema.DisplayType.PICKLIST) {
            throw new AuraHandledException('El campo SubGestion__c no es un picklist.');
        }

        // Obtener los valores del picklist 'SubGestion__c'
        List<Schema.PicklistEntry> subGestionPicklistEntries = subGestionFieldDescribe.getPicklistValues();
        Boolean isValidSubGestion = false;

        // Verificar si el valor de 'subGestion' es válido
        for (Schema.PicklistEntry entry : subGestionPicklistEntries) {
            if (entry.getValue().trim().equalsIgnoreCase(subGestion.trim())) {
                isValidSubGestion = true;
                break;
            }
        }

        if (!isValidSubGestion) {
            throw new AuraHandledException('El valor "' + subGestion + '" no es válido para el campo SubGestión.');
        }

        // Obtener la descripción del campo 'Delivery_Method__c'
        Schema.DescribeFieldResult deliveriMethodFieldDescribe = orderDescribe.fields.getMap().get('Delivery_Method__c').getDescribe();
        if (deliveriMethodFieldDescribe.getType() != Schema.DisplayType.PICKLIST) {
            throw new AuraHandledException('El campo Delivery_Method__c no es un picklist.');
        }

        // Obtener los valores del picklist 'Delivery_Method__c'
        List<Schema.PicklistEntry> deliveryMethodPicklistEntries = deliveriMethodFieldDescribe.getPicklistValues();
        Boolean isValidDelivery = false;

        // Verificar si el valor de 'deliveryMethod' es válido
        for (Schema.PicklistEntry entry : deliveryMethodPicklistEntries) {
            if (entry.getValue().trim().equalsIgnoreCase(deliveryMethod.trim())) {
                isValidDelivery = true;
                break;
            }
        }

        if (!isValidDelivery) {
            throw new AuraHandledException('El valor "' + deliveryMethod + '" no es válido para el campo Gestión.');
        }
        // Crear la nueva Orden con la fecha proporcionada
        Order newOrder = new Order(
            AccountId = accountId,
            Name = orderName,
            Gestion__c = gestion,
            SubGestion__c = subGestion,
            Delivery_Method__c = deliveryMethod,
            Status = 'Draft', 
            EffectiveDate = Date.valueOf(effectiveDate) 
        );

        try {
            insert newOrder;
            System.debug(LoggingLevel.INFO, 'Orden creada con ID: ' + newOrder.Id);
        } catch (Exception e) {
            throw new AuraHandledException('Error al crear la orden: ' + e.getMessage());
        }

        return newOrder;
    }
}
