import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HotToastService } from '@ngneat/hot-toast';
import { Subscription } from 'rxjs';

@Component({
  selector: 'time-manager',
  templateUrl: './time-manager.component.html',
  styleUrls: ['./time-manager.component.scss']
})
export class TimeManagerComponent implements OnInit, OnDestroy {
  timeForm: FormGroup;
  timeFormEdit: FormGroup;
  timeList: any;

  timeListFiltered: any;

  itemToEdit: any;
  
  selectedDate: any;
  selectedDateId: string = '';
  selectedItemId: string = '';

  modalCase: number = 0;
  confirmationCase: number = 0;
  modalOpen: number = 0;

  private timeSubscription!: Subscription;
  @Input() dateList: any;
  @Output() timeListLoaded = new EventEmitter<any>();
  constructor(private fb: FormBuilder, private firestore: AngularFirestore, private toast: HotToastService) { 
    this.timeForm = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required]
    });
    this.timeFormEdit = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.timeSubscription = this.firestore.collection('hours', ref => ref.where('available', '==', true).orderBy('hour', 'asc')).valueChanges({idField: 'id'}).subscribe(ss => {
      this.timeList = ss;
      if(this.dateList.length !== 0) {
        if(this.selectedDateId) {
          //if a specific date was chosen, only show the hours corresponding to the date selected
          this.timeListFiltered = this.timeList.filter((x:any) => x.dateId == this.selectedDateId);
        } else {
          //if no specific date was chosen by the user, as default, show hours corresponding to the first date in the list
          this.timeListFiltered = this.timeList.filter((x:any) => x.dateId == this.dateList[0].id);
        }
        //sort list by ascending hours
        this.timeListFiltered = this.timeListFiltered.sort((a:any, b:any) => a.hour.localeCompare(b.hour));
        //emit to parent
        this.timeListLoaded.emit(this.timeListFiltered);
      }
    });
  }

  filterTimeByDate(event: any) {
    this.selectedDateId = event.id;

    this.timeListFiltered = this.timeList.filter((x:any) => x.dateId == this.selectedDateId);

    //emit to parent
    this.timeListLoaded.emit(this.timeListFiltered);
  }

  //displaying different forms based on modalCaseNumber
  //modalOpen 1 = modal is opened & modalOpen 2 = modal closed & modalOpen 0 = default value
  openModal(modalCaseNumber: number, editObject?: any) {
    this.modalCase = modalCaseNumber;
    this.modalOpen = 1;
    if(editObject) {
      this.selectedItemId = editObject.id;
    }
    
    if(this.modalCase === 3) {
      this.timeForm.patchValue({
        date: this.selectedDateId
      });
    }

    if(this.modalCase === 4 && editObject) {
      this.itemToEdit = editObject;
      let _date = this.dateList.find((x:any) => x.id === this.itemToEdit.dateId);

      this.timeFormEdit.patchValue({
        date: _date?.date,
        time: this.itemToEdit.hour
      });
    }
  }

   //set every value back to its default value, except modal
  closeModal() {
    this.modalCase = 0;
    this.confirmationCase = 0;
    this.modalOpen = 2;
  }

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
    if(this.confirmationCase === 2) {
      if(this.selectedItemId) {
        this.deleteTime(this.selectedItemId);
        this.confirmationCase = 0;
        this.modalOpen = 2;
      }
    }
  }

  //**************************************************************
  //
  //**********************  TIME SECTION  ************************
  //
  //**************************************************************

  addTime() {
    //create id to store it inside of the document as well
    const id = this.firestore.createId();
    const batch = this.firestore.firestore.batch()

    let Record = {
      available: true,
      dateId: this.timeForm.value.date,
      hour: this.timeForm.value.time,
      stateStatus: 0,
      id: id
    }

    //set the id to the hour added to the date => this is used for filtering and for setting the default value in the select element
    this.selectedDateId = this.timeForm.value.date;

    if(Record.hour !== null) {
      batch.set(this.firestore.firestore.doc(`hours/${id}`), Record)

      let dateToUpdate = this.dateList.find((x:any) => x.id === this.selectedDateId);
  
      batch.update(this.firestore.firestore.doc(`dates/${this.selectedDateId}`), { 
        available: true,
        availableTimes: dateToUpdate!.availableTimes + 1
      })
  
      batch.commit().then(() => {
        this.timeForm.controls['time'].reset();
        this.toast.success('Added time. Yay!', { position: 'bottom-center' });
      })
      .catch(e => {
        console.log(e);
        this.toast.error("Oh no bradar, something went wrong.", { position: 'bottom-center' });
      });
    }
  }


  submitEditedTime() {
    let selectedDate = this.dateList.find((x:any) => x.date === this.timeFormEdit.value.date)

    let Record = {
      available: this.itemToEdit.available,
      dateId: selectedDate!.id,
      hour: this.timeFormEdit.value.time,
      id: this.itemToEdit.id,
      stateStatus: this.itemToEdit.stateStatus,
    }

    //set the id to the hour added to the date => this is used for filtering and for setting the default value in the select element
    this.selectedDateId = selectedDate!.id;

    this.firestore.collection('hours').doc(this.selectedItemId).update(Record).then(() => {
      this.modalOpen = 2;
      this.modalCase = 0;
      this.selectedItemId = '';
      this.timeFormEdit.reset();
      this.toast.success('Time updated. Yay!', { position: 'bottom-center' });
    }).catch(e => {
      console.log(e);
      this.toast.error("Oh no manz, something went wrong.", { position: 'bottom-center' });
    });
  }


  deleteTime(docId: string) {
    const batch = this.firestore.firestore.batch()

    if(!this.selectedDateId) {
      let timeToDelete = this.timeListFiltered.find((x:any) => x.id === docId);
      this.selectedDateId = timeToDelete.dateId;
    }
    let dateToUpdate = this.dateList.find((x:any) => x.id === this.selectedDateId);

    batch.delete(this.firestore.firestore.doc(`hours/${docId}`));

    if(dateToUpdate!.availableTimes === 1) {
      batch.update(this.firestore.firestore.doc(`dates/${this.selectedDateId}`), {
        available: false,
        availableTimes: dateToUpdate!.availableTimes - 1,})
    } 
    if(dateToUpdate!.availableTimes > 1) {
      batch.update(this.firestore.firestore.doc(`dates/${this.selectedDateId}`), {
        availableTimes: dateToUpdate!.availableTimes - 1
      });
    }

    batch.commit().then(() => {
      this.toast.success('Time deleted. Yay!', { position: 'bottom-center' });
    }).catch(e => {
      console.log(e);
      this.toast.error("Oh no manz, something went wrong.", { position: 'bottom-center' });
    });
    // this.filterTimesByDateId();
  }

  ngOnDestroy(): void {
    this.timeSubscription && this.timeSubscription.unsubscribe();
  }
}
