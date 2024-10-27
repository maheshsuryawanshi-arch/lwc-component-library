import { LightningElement, wire } from 'lwc';
import getAccountsByName from '@salesforce/apex/AccountController.getAccountsByName';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { updateRecord } from "lightning/uiRecordApi";
import { refreshApex } from "@salesforce/apex"


const columns = [
    { label: 'Account Name', fieldName: 'Name', sortable: true },
    { label: 'Industry', fieldName: 'Industry', sortable: true },
    { label: 'Annual Revenue', fieldName: 'AnnualRevenue', type: 'currency', editable: true, sortable: true },
];
export default class CustomDataTable extends LightningElement {
    columns = columns;
    data = [];
    error;

    searchKey = '';
    isVisible = false;

    sortedBy;
    sortDirection;

    draftValues = [];

    // PAGINATION PROPERTIES
    pageSize = 10;
    pageNumber = 1;
    totalRecords = 0;
    enablePagination = true;

    @wire(getAccountsByName, { searchKey: '$searchKey' })
        wiredAccounts({ error, data }) {
            if (data) {
                this.data = data;
                this.isVisible = this.data.length === 0;
                this.totalRecords = this.data.length;
            }
            else if (error) {
                this.error = error;
                this.data = undefined;
        }
    }

    handleKeyChange(event) {
        this.searchKey = event.target.value;
    }

    handleSave(event) {
        const records = event.detail.draftValues.slice().map((draftValues) =>{
            const fields = Object.assign({}, draftValues);
            return { fields };
        });
        
        this.draftValues = [];

        try {
            const promises = records.map((record) => updateRecord(record));
            Promise.all(promises);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Records Updated',
                    variant: 'success'
                })
            );
            refreshApex(this.data);
        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error updating record',
                    message: error.body.message,
                    variant: 'error',
                }),
            );
        }
    }

    // Used to sort the column
    sortBy(field, reverse, primer) {
        const key = primer
            ? function (x) {
                  return primer(x[field]);
              }
            : function (x) {
                  return x[field];
              };

        return function (a, b) {
            a = key(a);
            b = key(b);
            return reverse * ((a > b) - (b > a));
        };
    }

    onHandleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.data];

        cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
        this.data = cloneData;
        this.sortDirection = sortDirection;
        this.sortedBy = sortedBy;
        this.pageNumber = 1;
    }

    get recordsToDisplay() {
        let from = (this.pageNumber - 1) * this.pageSize,
            to = this.pageSize * this.pageNumber;
        return this.data?.slice(from, to);
    }

    get showPaginator() {
        return this.enablePagination;
    }

     paginationChangeHandler(event) {
        if (event.detail) {
            this.pageNumber = event.detail.pageNumber;
            this.pageSize = event.detail.pageSize;
        }
    }
}