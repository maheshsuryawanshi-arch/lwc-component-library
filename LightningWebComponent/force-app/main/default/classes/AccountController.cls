public with sharing class AccountController {
    
    @AuraEnabled(cacheable = true)
    public static List<Account> getAccountsByName(String searchKey){

        String searchTerm = '%' + searchKey + '%';

        //SOQL query to get object of account
        List<Account> accList = [SELECT Id, Name, Industry, AnnualRevenue FROM Account WHERE Name LIKE : searchTerm];

        return accList;
        
    }
}