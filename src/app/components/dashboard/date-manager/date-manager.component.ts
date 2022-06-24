import { DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy, Output, Input, EventEmitter } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HotToastService } from '@ngneat/hot-toast';
import { Subscription } from 'rxjs';

@Component({
  selector: 'date-manager',
  templateUrl: './date-manager.component.html',
  styleUrls: ['./date-manager.component.scss']
})
export class DateManagerComponent implements OnInit, OnDestroy {
  //used for deleting objects
  selectedItemId: string = '';
  //used for manipulating objects/filtering arrays
  selectedDateId: string = '';
  //used for editing date object
  selectedDate: any;

  modalCase: number = 0;
  confirmationCase: number = 0;
  modalOpen: number = 0;

  dateForm: FormGroup;
  dateFormEdit: FormGroup;


  dateList: any = [];
  itemToEdit: any;

  private dateSubscription!: Subscription;
  @Input() timeList: any;
  @Output() dateListLoaded = new EventEmitter<any>();
  constructor(private fb: FormBuilder, private firestore: AngularFirestore, private toast: HotToastService) {
    this.dateForm = this.fb.group({
      date: ['', Validators.required],
    });
    this.dateFormEdit = this.fb.group({
      date: ['', Validators.required],
    }); 
  }

  ngOnInit(): void {
    this.dateSubscription = this.firestore.collection('dates', ref => ref.where('stateStatus', '==', 0)).valueChanges().subscribe((ss: any) => {
      //sort the dates by starting with the oldest date
      this.dateList = ss;

      this.dateList.sort((a:any, b:any) => {
        var aa = a.date.split('/').reverse().join(),
            bb = b.date.split('/').reverse().join();
        return aa < bb ? -1 : (aa > bb ? 1 : 0);
      });

      this.selectedDate = this.dateList[0].date;
      this.dateListLoaded.emit(this.dateList);
    });
  }

  //displaying different forms based on modalCaseNumber
  //modalOpen 1 = modal is opened & modalOpen 2 = modal closed & modalOpen 0 = default value
  openModal(modalCaseNumber: number, editObject?: any) {
    this.modalCase = modalCaseNumber;
    this.modalOpen = 1;
    if(editObject) {
      this.selectedItemId = editObject.id;
    }

    if(this.modalCase === 2 && editObject) {
      this.itemToEdit = editObject;
      let _date = this.itemToEdit.date.replace(/\//g, '-');
      let formattedDate = _date.split('-').reverse().join('-');

      this.dateFormEdit.patchValue({
        date: formattedDate
      });
    }
  }

  //set every value back to its default value, except modal
  closeModal() {
    this.modalCase = 0;
    this.confirmationCase = 0;
    this.modalOpen = 2;
  }

  //**************************************************************
  //
  //*********************  DELETE SECTION  ***********************
  //
  //**************************************************************

  //confirmation case 0 = no verification question is displayed
  //else, the verification questions are shown
  deleteConfirmationModal(caseNo: number, itemId: string) {
    //setting the selected item id, when there is an item to delete
    this.selectedItemId = itemId;
    this.confirmationCase = caseNo;
    this.modalOpen = 1;
  }


  //verification question close/cancel
  confirmFalse() {
    this.confirmationCase = 0;
    this.modalOpen = 2;
    if(this.selectedItemId) {
      this.selectedItemId = '';
    }
  }


  //on confirmation, delete either date or time, based on the confirmation case
  confirmTrue(event: Event) {
    event.stopPropagation();
    if(this.confirmationCase === 1) {
      if(this.selectedItemId) {
        this.deleteDate(this.selectedItemId);
        this.confirmationCase = 0;
        this.modalOpen = 2;
      }
    }
  }


  //**************************************************************
  //
  //**********************  DATE SECTION  ************************
  //
  //**************************************************************

  //used when creating a date item
  formatDate(date: string) {
    const dateFormated = new DatePipe('en-US').transform(date, 'dd/MM/yyyy')
    return dateFormated;
  }


  addDate() {
    //create id to store it inside of the document as well
    const id = this.firestore.createId();

    let Record = {
      date: this.formatDate(this.dateForm.value.date),
      id: id,
      available: false,
      stateStatus: 0,
      availableTimes: 0,
    }

    this.firestore.doc(`dates/${id}`).set(Record)
    .then(res => {
      // this.modalOpen = 2;
      // this.modalCase = 0;
      this.closeModal();
      this.dateForm.reset();
      this.toast.success('Date added. Oye!', { position: 'bottom-center' });
    })
    .catch(e => {
      console.log(e);
      this.toast.error('Ayay, something went wrong.', { position: 'bottom-center' });
    });
  }

  submitEditedDate() {
    let Record = {
      available: this.itemToEdit.available,
      date: this.formatDate(this.dateFormEdit.value.date),
      id: this.itemToEdit.id,
      stateStatus: this.itemToEdit.stateStatus,
      availableTimes: this.itemToEdit.availableTimes,
    }
    
    this.firestore.collection('dates').doc(this.selectedItemId).update(Record).then(() => {
      this.modalOpen = 2;
      this.selectedItemId = '';
      this.dateFormEdit.reset();
      this.toast.success('Date updated. Oye!', { position: 'bottom-center' });
    }).catch(e => {
      console.log(e);
      this.toast.error('Ayay, something went wrong.', { position: 'bottom-center' });
    });
  }

  deleteDate(docId: string) {
    const batch = this.firestore.firestore.batch()
    //delete the date itself
    batch.delete(this.firestore.firestore.collection('dates').doc(docId));
    //if date gets deleted, delete every single time associated with the date
    const hoursToDelete = this.timeList.filter((item: any) => item.dateId === docId);

    hoursToDelete.forEach((item: any) => {
      item.id && batch.delete(this.firestore.firestore.collection('hours').doc(item.id))
    })

    batch.commit().then(() => {
      //set the id back to the first item in the list => this is used for filtering and for setting the default value in the select element
      this.selectedDateId = this.dateList[0].id;
      this.toast.success('Date deleted. Yay!', { position: 'bottom-center' });
    }).catch((e:any) => {
      console.log(e);
      this.toast.error("Ohno, something went wrong.", { position: 'bottom-center' });
    })
  }

  ngOnDestroy(): void {
    this.dateSubscription && this.dateSubscription.unsubscribe();
  }
}
