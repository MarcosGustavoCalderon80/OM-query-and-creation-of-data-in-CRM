public with sharing class CreateContactController {
    @AuraEnabled
    public static Contact createContact(String firstName, String lastName, String email, String phone, String accountId, String newAccountName) {
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
        Contact newContact = new Contact(
            AccountId = accountId,
            FirstName = firstName, 
            LastName = lastName, 
            Email = email, 
            Phone = phone);
        try {
                insert newContact;
                System.debug(LoggingLevel.INFO, 'Contacto creado con ID: ' + newContact.Id);
        } catch (Exception e) {
                throw new AuraHandledException('Error al crear el contacto: ' + e.getMessage());
        }
        return newContact;
    }
}