import getAccounts from '@salesforce/apex/CRMController.getAccounts';
import getContacts from '@salesforce/apex/CRMController.getContacts';
import getOrders from '@salesforce/apex/CRMController.getOrders';
import saveAccount from '@salesforce/apex/CRMController.saveAccount';
import saveContact from '@salesforce/apex/CRMController.saveContact';
import saveOrder from '@salesforce/apex/CRMController.saveOrder';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { LightningElement, track, wire } from 'lwc';

export default class MiniCRM extends LightningElement {
    isAddFormVisible = false;
    isAddingContact = false;
    isAddingAccount = false;
    isAddingOrder = false;

    @track firstName = '';
    @track lastName = '';
    @track email = '';
    @track phone = '';
    @track accountId = '';
    @track newAccountName = '';
    @track Name = '';
    @track orderName = '';
    @track description = '';
    @track gestion = '';
    @track effectiveDate = '';
    Status = 'Draft';
    // @track subGestion = '';
    // @track deliveryMethod = '';

    @wire(getContacts)
    wiredContacts({ error, data }) {
        if (data) {
            this.contacts = data;
        } else if (error) {
            console.error('Error fetching contacts:', error);
            this.showToast('Error', 'Error fetching contacts.', 'error');
        }
    }

    @wire(getAccounts)
    wiredAccounts({ error, data }) {
        if (data) {
            // Ordenamos las cuentas por Name alfabéticamente
            this.accounts = [...data].sort((a, b) => {
                return a.Name.localeCompare(b.Name); // Orden ascendente (A-Z)
            });
        } else if (error) {
            console.error('Error fetching accounts:', error);
            this.showToast('Error', 'Error fetching accounts.', 'error');
        }
    }
    @wire(getOrders)
    wiredOrders({ error, data }) {
        if (data) {
            // Asignamos los datos y los ordenamos por EffectiveDate
            this.orders = [...data].sort((a, b) => {
                const dateA = new Date(a.EffectiveDate);
                const dateB = new Date(b.EffectiveDate);
                return dateB - dateA; // Orden ascendente, usa dateB - dateA para descendente
            });
        } else if (error) {
            console.error('Error fetching orders:', error);
            this.showToast('Error', 'Error fetching orders.', 'error');
        }
    }

    handleTypeChange(event) {
        const selectedType = event.target.value;
        this.isAddFormVisible = true;

        switch (selectedType) {
            case 'contact':
                this.isAddingContact = true;
                this.isAddingAccount = false;
                this.isAddingOrder = false;
                break;
            case 'account':
                this.isAddingContact = false;
                this.isAddingAccount = true;
                this.isAddingOrder = false;
                break;
            case 'order':
                this.isAddingContact = false;
                this.isAddingAccount = false;
                this.isAddingOrder = true;
                break;
        }
    }

    handleInputChange(event) {
        const field = event.target.name;
        this[field] = event.target.value;
    }

    handleAddContactClick() {
        this.handleTypeChange({ target: { value: 'contact' } });
    }

    handleAddAccountClick() {
        this.handleTypeChange({ target: { value: 'account' } });
    }

    handleAddOrderClick() {
        this.handleTypeChange({ target: { value: 'order' } });
    }

    handleListContactsClick() {
        this.handleTypeChange({ target: { value: 'contact' } });
        this.isAddFormVisible = false;
    }

    handleListAccountsClick() {
        this.handleTypeChange({ target: { value: 'account' } });
        this.isAddFormVisible = false;
    }

    handleListOrdersClick() {
        this.handleTypeChange({ target: { value: 'order' } });
        this.isAddFormVisible = false;
    }

    handleSubmit(event) {
        event.preventDefault();

        // Validar campos obligatorios
        if (this.isAddingContact && (!this.firstName || !this.lastName || !this.email)) {
            this.showToast('Validation Error', 'Please fill in all required fields.', 'error');
            return;
        }

        if (this.isAddingAccount && !this.newAccountName) {
            this.showToast('Validation Error', 'Account Name is required.', 'error');
            return;
        }

        if (this.isAddingOrder) {
            // Validate required fields
            if (!this.orderName || !this.accountId || !this.effectiveDate) {
                this.showToast('Validation Error', 'Order Name, Account ID, and Effective Date are required.', 'error');
                return;
            }
        }
        let newItem = {};

        if (this.isAddingContact) {
            newItem = {
                FirstName: this.firstName,
                LastName: this.lastName,
                Email: this.email,
                Phone: this.phone,
                accountId: this.accountId
            };
            saveContact({ newContact: newItem })
                .then(() => {
                    return getContacts(); // Vuelve a cargar los contactos
                })
                .then(data => {
                    this.contacts = data; // Actualiza la lista de contactos
                    this.clearInputFields();
                    this.isAddFormVisible = false;
                    this.showToast('Success', 'Contact created successfully.', 'success');
                })
                .catch(error => {
                    console.error('Error saving contact:', error);
                    this.showToast('Error', `Error saving contact: ${error.body.message}`, 'error');
                });
            } else if (this.isAddingAccount) {
                newItem = {
                    Name: this.newAccountName,
                    Phone: this.phone
                };
                saveAccount({ newAccount: newItem })
                    .then(() => getAccounts())
                    .then(data => {
                        this.accounts = [...data].sort((a, b) => {
                            return a.Name.localeCompare(b.Name); // Orden ascendente (A-Z)
                        });
                        this.clearInputFields();
                        this.isAddFormVisible = false;
                        this.showToast('Success', 'Account created successfully.', 'success');
                    })
                    .catch(error => {
                        console.error('Error saving account:', error);
                        this.showToast('Error', `Error saving account: ${error.body.message}`, 'error');
                    });
            
            } else if (this.isAddingOrder) {
                newItem = {
                    Name: this.orderName,
                    Gestion__c: this.gestion,
                    Description: this.description,
                    AccountId: this.accountId,
                    EffectiveDate: this.effectiveDate,
                    Status: this.Status

            };
            saveOrder({ newOrder: newItem })
                .then(() => {
                    return getOrders(); // Vuelve a cargar las órdenes
                })
                .then(data => {
                    this.orders = data; // Actualiza la lista de órdenes
                    this.clearInputFields();
                    this.isAddFormVisible = false;
                    this.showToast('Success', 'Order created successfully.', 'success');
                })
                .catch(error => {
                    console.error('Error saving order:', error);
                    this.showToast('Error', `Error saving order: ${error.body.message}`, 'error');
                });
        }
    }

    clearInputFields() {
        this.firstName = '';
        this.lastName = '';
        this.email = '';
        this.phone = '';
        this.accountId = '';
        this.newAccountName = '';
        this.Name = '';
        this.description = '';
        this.gestion = '';
        this.effectiveDate = '';
        this.orderName = '';
    }

    get items() {
        if (this.isAddingContact) return this.contacts;
        if (this.isAddingAccount) return this.accounts;
        if (this.isAddingOrder) return this.orders;
        return [];
    }

    get isListView() {
        return !this.isAddFormVisible;
    }
    // Redirigir a la vista del contact en una nueva pestaña
    handleAccountClick(event) {
        const accountId = event.target.dataset.id;
        const url = `/lightning/r/Account/${accountId}/view`;
        window.open(url, '_blank');  // Abrir en una nueva pestaña
    }
    // Redirigir a la vista de la cuenta en una nueva pestaña
    handleContactClick(event) {
        const contact = event.target.dataset.id;
        const url = `/lightning/r/Contact/${contact.Id}/view`;
        window.open(url, '_blank');  // Abrir en una nueva pestaña
    }
    // Redirigir a la vista de la orden en una nueva pestaña
    handleOrderClick(event) {
        const orderId = event.target.dataset.id;
        const url = `/lightning/r/Order/${orderId}/view`;
        window.open(url, '_blank');  
    }
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        }));
    }
}