import createOrder from '@salesforce/apex/CreateOrderController.createOrder';
import getPicklistValues from '@salesforce/apex/PicklistController.getPicklistValues';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { LightningElement, track, wire } from 'lwc';

export default class CreateOrderForm extends LightningElement {
    @track orderName = '';
    @track gestion = '';
    @track subGestion = '--None--';
    @track deliveryMethod = '--None--';
    @track accountId = '';
    @track newAccountName = '';
    @track effectiveDate = new Date(); 
    
    // Variables para almacenar las opciones de los picklists
    @track gestionOptions = [];
    @track subGestionOptions = [];
    @track deliveryMethodOptions = [];

    // Obtener valores de picklist para "Gestión"
    @wire(getPicklistValues, { objectName: 'Order', fieldName: 'Gestion__c' })
    gestionValues({ data, error }) {
        if (data) {
            this.gestionOptions = data.map(value => ({ label: value, value }));
        } else if (error) {
            this.showToast('Error', 'No se pudieron cargar los valores de "Gestión".', 'error');
        }
    }

    // Obtener valores de picklist para "SubGestión"
    @wire(getPicklistValues, { objectName: 'Order', fieldName: 'SubGestion__c' })
    subGestionValues({ data, error }) {
        if (data) {
            this.subGestionOptions = data.map(value => ({ label: value, value }));
        } else if (error) {
            this.showToast('Error', 'No se pudieron cargar los valores de "SubGestión".', 'error');
        }
    }
    // Obtener valores de picklist para "DeliveryMethod"
    @wire(getPicklistValues, { objectName: 'Order', fieldName: 'Delivery_Method__c' })
    deliveryMethodValues({ data, error }) {
        if (data) {
            this.deliveryMethodOptions = data.map(value => ({ label: value, value }));
        } else if (error) {
            this.showToast('Error', 'No se pudieron cargar los valores de "DeliveryMethod".', 'error');
        }
    }
    handleInputChange(event) {
        
        const field = event.target.name;
        if (field === 'orderName') {
            this.orderName = event.target.value;
        } else if (field === 'gestion') {
            this.gestion = event.target.value;
        } else if (field === 'subGestion') {
            this.subGestion = event.target.value;
        } else if (field === 'accountId') {
            this.accountId = event.target.value;
        } else if (field === 'newAccountName') {
            this.newAccountName = event.target.value;
        } else if (field === 'effectiveDate') {
            this.effectiveDate = event.target.value;
        } else if (field === 'deliveryMethod') {
            this.deliveryMethod = event.target.value;
        }
    }; 

    handleSubmit() {
        // Validación básica para todos los campos
        if (!this.orderName || !this.gestion || !this.effectiveDate) {
            this.showToast('Error', 'Todos los campos son obligatorios', 'error');
            return;
        }
        // Validar que el valor de 'effectiveDate' sea una fecha válida
        const parsedDate = new Date(this.effectiveDate);
        if (isNaN(parsedDate)) {
            this.showToast('Error', 'La fecha de inicio no es válida', 'error');
        return;
        }
        // Validar que el valor seleccionado en 'gestion' sea uno de los valores del picklist
        if (!this.gestionOptions.find(option => option.value === this.gestion)) {
            this.showToast('Error', 'El valor seleccionado para Gestión no es válido', 'error');
            return;
        }
    
        // Validar que el valor seleccionado en 'subGestion' sea uno de los valores del picklist
        if (!this.subGestionOptions.find(option => option.value === this.subGestion)) {
            this.showToast('Error', 'El valor seleccionado para SubGestión no es válido', 'error');
            return;
        }
        
        // Validar que el valor seleccionado en 'deliveryMethod' sea uno de los valores del picklist
        if (!this.deliveryMethodOptions.find(option => option.value === this.deliveryMethod)) {
            this.showToast('Error', 'El valor seleccionado para Delivery Method no es válido', 'error');
            return;
        }
        // Formatear la fecha a 'yyyy-mm-dd'
        const formattedDate = parsedDate.toISOString().split('T')[0];

        // Llamar al Apex para crear la orden
        createOrder({
            accountId: this.accountId, 
            newAccountName: this.newAccountName, 
            orderName: this.orderName,
            gestion: this.gestion,
            subGestion: this.subGestion,
            deliveryMethod: this.deliveryMethod,
            effectiveDate: formattedDate
        })
        .then(result => {
            console.log('Order created successfully:', result);
            this.showToast('Éxito', 'La orden se creó correctamente', 'success');
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

    clearInputField() {
        this.orderName = '';
        this.gestion = '';
        this.accountId = '';
        this.newAccountName = '';
    }
}
