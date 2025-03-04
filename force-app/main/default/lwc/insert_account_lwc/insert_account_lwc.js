import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import ACCOUNT_NAME from '@salesforce/schema/Account.Name';
import ACCOUNT_PHONE from '@salesforce/schema/Account.Phone';
import ACCOUNT_WEBSITE from '@salesforce/schema/Account.Website';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { createRecord } from 'lightning/uiRecordApi';
import { LightningElement, track } from 'lwc';

class Insert_account_lwc extends LightningElement {
    @track accountName;
    @track phone;
    @track Website;

    handlerAccountName(event) {
        this.accountName = event.target.value;
        console.log(`Name: ${this.accountName}`);
    }

    handlerPhone(event) {
        this.phone = event.target.value;
        console.log(`Phone: ${this.phone}`);
    }
    handlerWebsite(event) {
        this.Website = event.target.value;
        console.log(`Website: ${this.Website}`);
    }

    saveAccountNameAndPhone() {
        const fields = {};
        fields[ACCOUNT_NAME.fieldApiName] = this.accountName;
        fields[ACCOUNT_PHONE.fieldApiName] = this.phone;
        fields[ACCOUNT_WEBSITE.fieldApiName] = this.Website;
        const recordInput = { apiName: ACCOUNT_OBJECT.objectApiName, fields };
        createRecord(recordInput)
            .then((success) => {
                console.log(`Éxito: ${success}`);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Éxito',
                        message: 'Se ha creado la cuenta exitosamente',
                        variant: 'success',
                    })
                    );
                    this.clearInputField();
                })
                .catch( error => {
                    console.log(`Error: ${error}`);
                    this.dispatchEvent(new ShowToastEvent({
                        title: 'Error',
                        message: 'Ha ocurrido un error, complete todos los campos de forma correcta!',
                        variant: 'Error',
                    }))
                })
    }

    clearInputField() {
        this.accountName = '';
        this.phone = '';
        this.Website = '';
    }
}

export default Insert_account_lwc;
