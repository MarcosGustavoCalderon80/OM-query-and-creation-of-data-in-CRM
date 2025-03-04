import searchAccounts from '@salesforce/apex/SearchController.searchAccounts';
import searchOrders from '@salesforce/apex/SearchController.searchOrders';
import { LightningElement, track } from 'lwc';

export default class SearchComponent extends LightningElement {
    @track searchTerm = ''; 
    @track accounts = [];    
    @track orders = [];      

    // Cambiar el valor de la búsqueda
    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        this.searchData();
    }

    // Realizar la búsqueda en Apex
    searchData() {
        // Búsqueda de cuentas
        searchAccounts({ searchTerm: this.searchTerm })
            .then(result => {
                this.accounts = result;
            })
            .catch(error => {
                this.accounts = [];
            });

        // Búsqueda de órdenes
        searchOrders({ searchTerm: this.searchTerm })
            .then(result => {
                this.orders = result;
            })
            .catch(error => {
                this.orders = [];
            });
    }

    // Redirigir a la vista de la cuenta en una nueva pestaña
    handleAccountClick(event) {
        const accountId = event.target.dataset.id;
        const url = `/lightning/r/Account/${accountId}/view`;
        window.open(url, '_blank');  // Abrir en una nueva pestaña
    }

    // Redirigir a la vista de la orden en una nueva pestaña
    handleOrderClick(event) {
        const orderId = event.target.dataset.id;
        const url = `/lightning/r/Order/${orderId}/view`;
        window.open(url, '_blank');  
    }

    // Limpiar el campo de búsqueda
    clearInputField() {
        this.accounts = [];
        this.orders = [];
        this.searchTerm = '';
    }
}
