public class CRMController {

    // Obtener contactos
    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts() {
        return [SELECT Id, FirstName, LastName, Email, Phone, AccountId FROM Contact];
    }

    // Obtener cuentas
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        return [SELECT Id, Name, Phone, Website FROM Account];
    }

    // Obtener órdenes
    @AuraEnabled(cacheable=true)
    public static List<Order> getOrders() {
        return [SELECT Id, Name, Description, EffectiveDate, AccountId, Gestion__c FROM Order where Status = 'Draft'];
    }

    // Guardar un nuevo contacto
    @AuraEnabled
    public static Contact saveContact(Contact newContact) {
        insert newContact;
        return newContact;
    }

    // Guardar una nueva cuenta
    @AuraEnabled
    public static Account saveAccount(Account newAccount) {
        insert newAccount;
        return newAccount;
    }

    // Guardar una nueva orden
    @AuraEnabled
    public static Order saveOrder(Order newOrder) {
        insert newOrder;
        return newOrder;
    }
}
