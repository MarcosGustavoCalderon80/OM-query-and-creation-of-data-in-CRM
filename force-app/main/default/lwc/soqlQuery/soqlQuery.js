import executeSoqlQuery from '@salesforce/apex/SoqlQueryController.executeQuery';
import getObjectFields from '@salesforce/apex/SoqlQueryController.getObjectFields';
import { LightningElement, track } from 'lwc';

export default class SoqlQueryExecutor extends LightningElement {
    @track soqlQuery = '';
    @track records = [];
    @track columns = [];
    @track error;
    @track fieldOptions = [];
    @track showFieldSuggestions = false;
    objectName = '';

    // Maneja el cambio en el campo de consulta SOQL
    handleQueryChange(event) {
        this.soqlQuery = event.target.value;
        this.extractObjectNameFromQuery();
        if (this.objectName) {
            this.fetchFields(this.objectName);
        } else {
            this.showFieldSuggestions = false;
        }
    }

    // Detecta teclas especiales (Enter y Esc)
    handleKeyDown(event) {
        if (event.key === 'Enter') {
            // Ejecuta la consulta al presionar Enter
            this.handleExecuteQuery();
        } else if (event.key === 'Escape') {
            // Oculta las sugerencias al presionar Esc
            this.showFieldSuggestions = false;
        }
    }

    // Extrae el nombre del objeto de la consulta SOQL
    extractObjectNameFromQuery() {
        const queryWords = this.soqlQuery.split(' ');
        const fromIndex = queryWords.findIndex(word => word.toLowerCase() === 'from');
        if (fromIndex > -1 && queryWords[fromIndex + 1]) {
            this.objectName = queryWords[fromIndex + 1].trim();
        } else {
            this.objectName = '';
        }
    }

    // Obtiene los campos del objeto para autocompletado
    fetchFields(objectName) {
        if (!objectName) return;
        getObjectFields({ objectName })
            .then(result => {
                const lastWord = this.soqlQuery.split(' ').pop();
                this.fieldOptions = result.filter(field => field.toLowerCase().includes(lastWord.toLowerCase()));
                this.showFieldSuggestions = this.fieldOptions.length > 0;
            })
            .catch(error => {
                let errorMessage = 'Error desconocido al obtener los campos';
                if (error.body && error.body.message) errorMessage = error.body.message;
                else if (error.message) errorMessage = error.message;
                this.error = errorMessage;
                this.showFieldSuggestions = false;
            });
    }

    // Maneja la selección de un campo del autocompletado
    handleFieldSelection(event) {
        const selectedField = event.target.dataset.field;
        const currentQuery = this.soqlQuery.split(' ');
        currentQuery.pop();
        currentQuery.push(selectedField);
        this.soqlQuery = currentQuery.join(' ');
        this.showFieldSuggestions = false;
    }

    // Ejecuta la consulta SOQL
    handleExecuteQuery() {
        if (this.soqlQuery.trim()) {
            console.log('Ejecutando consulta SOQL:', this.soqlQuery);
            executeSoqlQuery({ query: this.soqlQuery })
                .then(result => {
                    console.log('Resultados recibidos:', result);
                    this.records = result.map(record => {
                        console.log('Procesando registro:', record);
                        const flattenedRecord = {};
                        Object.keys(record).forEach(key => {
                            if (key !== 'attributes') {
                                if (typeof record[key] === 'object' && record[key] !== null) {
                                    Object.keys(record[key]).forEach(subKey => {
                                        flattenedRecord[`${key}_${subKey}`] = record[key][subKey];
                                    });
                                } else {
                                    flattenedRecord[key] = record[key];
                                }
                            }
                        });
                        const objectType = record.attributes && record.attributes.type ? record.attributes.type : 'Unknown';
                        flattenedRecord.recordUrl = `/lightning/r/${objectType}/${record.Id}/view`;
                        return flattenedRecord;
                    });
                    if (result.length > 0) {
                        this.columns = Object.keys(this.records[0])
                            .filter(key => key !== 'attributes')
                            .map(key => ({
                                label: key.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                                fieldName: key,
                                type: key === 'recordUrl' ? 'url' : 'text'
                            }));
                        this.columns = [...this.columns];
                        this.records = [...this.records];
                    } else {
                        this.columns = [];
                    }
                    console.log('Records asignados:', this.records);
                    console.log('Columns asignados:', this.columns);
                    this.error = undefined;
                })
                .catch(error => {
                    console.error('Error completo en handleExecuteQuery:', error);
                    let errorMessage = 'Error desconocido al ejecutar la consulta';
                    if (error.body && error.body.message) errorMessage = error.body.message;
                    else if (error.message) errorMessage = error.message;
                    this.records = [];
                    this.columns = [];
                    this.error = errorMessage;
                });
        } else {
            this.error = 'Por favor, ingresa una consulta SOQL válida.';
            this.records = [];
            this.columns = [];
        }
    }

    // Getters para la longitud y condiciones del template
    get recordsLength() {
        return this.records ? this.records.length : 0;
    }

    get columnsLength() {
        return this.columns ? this.columns.length : 0;
    }

    get hasRecords() {
        return this.records && this.records.length > 0;
    }
}