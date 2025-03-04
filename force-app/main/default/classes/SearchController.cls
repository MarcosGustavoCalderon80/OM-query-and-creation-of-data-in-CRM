public with sharing class SearchController {

    @AuraEnabled(cacheable=true)
    public static List<Account> searchAccounts(String searchTerm) {
        List<Account> accounts;
        
        // Si searchTerm es un Id, buscamos por Id
        if (searchTerm.length() == 18 || searchTerm.length() == 15) {
            accounts = [SELECT Id, Name FROM Account WHERE Id = :searchTerm LIMIT 5];
        } else {
            // Si no es un Id, buscamos por Name
            String searchQuery = '%' + searchTerm + '%';
            accounts = [SELECT Id, Name FROM Account WHERE Name LIKE :searchQuery LIMIT 5];
        }
        
        return accounts;
    }

    @AuraEnabled(cacheable=true)
    public static List<Order> searchOrders(String searchTerm) {
        List<Order> orders;
        
        // Si searchTerm es un Id, buscamos por AccountId o OrderId
        if (searchTerm.length() == 18 || searchTerm.length() == 15) {
            orders = [SELECT Id, AccountId, OrderNumber, Name FROM Order WHERE AccountId = :searchTerm OR Id = :searchTerm LIMIT 5];
        } else {
            // Si no es un Id, buscamos por OrderNumber o Name
            String searchQuery = '%' + searchTerm + '%';
            orders = [SELECT Id, AccountId, OrderNumber, Name FROM Order WHERE OrderNumber LIKE :searchQuery OR Name LIKE :searchQuery LIMIT 5];
        }

        return orders;
    }
}
