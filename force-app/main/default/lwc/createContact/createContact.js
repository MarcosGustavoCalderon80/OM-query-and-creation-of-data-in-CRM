import createContact from '@salesforce/apex/CreateContactController.createContact';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { LightningElement, track } from 'lwc';

export default class CreateContact extends LightningElement {
    @track firstName = '';
    @track lastName = '';
    @track email = '';
    @track phone = '';
    @track accountId = '';
    @track newAccountName = '';
    
    handleInputChange(event) {
        const field = event.target.name;
        if (field === 'firstName') {
            this.firstName = event.target.value;
        } else if (field === 'lastName') {
            this.lastName = event.target.value;
        } else if (field === 'email') {
            this.email = event.target.value;
        } else if (field === 'phone') {
            this.phone = event.target.value;
        } else if (field === 'accountId') {
            this.accountId = event.target.value;
        } else if (field === 'newAccountName') {
            this.newAccountName = event.target.value;
        }
    };
    handleSubmit() {
        if (!this.firstName || !this.lastName || !this.email) {
            this.showToast('Error', 'Todos los campos son obligatorios', 'error');
            return;
        }
        
        createContact({ 
            firstName: this.firstName, 
            lastName: this.lastName, 
            email: this.email, 
            phone : this.phone,
            accountId: this.accountId, 
            newAccountName: this.newAccountName 
        })
        .then(result => {
            console.log('Contact created successfully:', result);
            this.showToast('Éxito', 'El Contacto se creó correctamente', 'success');
            this.clearInputField();
        })
        .catch(error => {
            console.error('Error creating order:', error);
            console.log('Error details:', error.body);
            this.showToast('Error', error.body.message, 'error');
        });
    }
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
    clearInputField(){
        this.firstName = '',
        this.lastName = '',
        this.email = '',
        this.phone = '',
        this.accountId = '',
        this.newAccountName = ''
    }
}