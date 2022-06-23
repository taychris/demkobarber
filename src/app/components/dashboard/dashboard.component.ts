import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { AuthService } from 'src/app/shared/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
// import { DateModel } from '../../shared/models/date';
// import * as moment from 'moment';
import { HotToastService } from '@ngneat/hot-toast'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnInit, OnDestroy {
  //used for deleting objects
  selectedItemId: string = '';
  //used for manipulating objects/filtering arrays
  selectedDateId: string = '';
  //used for editing date object
  selectedDate: any;
  //used for filtering appointment list
  selectedAppointmentDate: string = '';

  modalCase: number = 0;
  confirmationCase: number = 0;
  modalOpen: number = 0;

  dateForm: FormGroup;
  dateFormEdit: FormGroup;
  timeForm: FormGroup;
  timeFormEdit: FormGroup;

  dateList: any = [];
  timeList: any;
  appointmentList: any;
  appointmentListDates: any;

  timeListFiltered: any;
  appointmentListFiltered: any = [];

  itemToEdit: any;

  private dateSubscription!: Subscription;
  private timeSubscription!: Subscription;
  private appointmentSubscription!: Subscription;

  constructor(public authService: AuthService, private fb: FormBuilder, private firestore: AngularFirestore, private toast: HotToastService) {
    this.dateForm = this.fb.group({
      date: ['', Validators.required],
    });
    this.dateFormEdit = this.fb.group({
      date: ['', Validators.required],
    });
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
    this.dateSubscription = this.firestore.collection('dates', ref => ref.where('stateStatus', '==', 0)).valueChanges().subscribe((ss: any) => {
      //sort the dates by starting with the oldest date
      this.dateList = ss;

      this.dateList.sort((a:any, b:any) => {
        var aa = a.date.split('/').reverse().join(),
            bb = b.date.split('/').reverse().join();
        return aa < bb ? -1 : (aa > bb ? 1 : 0);
      });

      this.selectedDate = this.dateList[0].date;
    });

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
      }
    });

    this.appointmentSubscription = this.firestore.collection('appointments', ref => ref.where('orderState', '<', 1).orderBy('orderState').orderBy('time')).valueChanges({idField: 'id'}).subscribe(ss => {
      this.appointmentList = ss;

      if(this.appointmentList) {
        //extract the dates from the appointment list > used for select dropdown values | FILTERING
        let result = this.appointmentList.map((item:any) => item.date);
        this.appointmentListDates = [...new Set(result)];
        
        //sort the extracted dates in an ascending manner
        this.appointmentListDates && this.appointmentListDates.sort((a:any, b:any) => { 
          var aa = a.split('/').reverse().join(),
              bb = b.split('/').reverse().join();
          return aa < bb ? -1 : (aa > bb ? 1 : 0);
        });

        if(this.selectedAppointmentDate === '' || this.selectedAppointmentDate === undefined) {
          this.selectedAppointmentDate = this.appointmentListDates[0];
        }

        if(this.selectedAppointmentDate) {
          this.appointmentListFiltered = this.appointmentList.filter((item:any) => item.date === this.selectedAppointmentDate);
        }
      }
    });

  }

  //on select changes
  onAppointmentDateChange(selectedDate: any) {
    this.selectedAppointmentDate = selectedDate.target.value;

    this.appointmentListFiltered = this.appointmentList.filter((item:any) => item.date === this.selectedAppointmentDate);
  }


  //display hours based on date selected
  filterTimeByDate(event: any) {
    this.selectedDateId = event.id;
    // this.selectedDate = dateToFind.date;

    this.timeListFiltered = this.timeList.filter((x:any) => x.dateId == this.selectedDateId);
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

    if(this.modalCase === 3) {
      this.timeForm.patchValue({
        date: this.selectedDateId
      });
    }

    if(this.modalCase === 4 && editObject) {
      this.itemToEdit = editObject;
      let _date = this.dateList.find((x:any) => x.id === this.itemToEdit.dateId);

      // console.log(_date?.date);

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
    if(this.confirmationCase === 2) {
      if(this.selectedItemId) {
        this.deleteTime(this.selectedItemId);
        this.confirmationCase = 0;
        this.modalOpen = 2;
      }
    }
    if(this.confirmationCase === 3) {
      if(this.selectedItemId) {
        this.finishAppointment(this.selectedItemId);
        this.confirmationCase = 0;
        this.modalOpen = 2;
      }
    }
    if(this.confirmationCase === 4) {
        if(this.selectedAppointmentDate) {
          this.finishAllAppointments(this.selectedAppointmentDate);
        } else {
          this.selectedAppointmentDate = this.appointmentListFiltered[0].date;
          this.finishAllAppointments(this.selectedAppointmentDate)
        }
        this.confirmationCase = 0;
        this.modalOpen = 2;
        
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
      //reset form, close pop-up modal when successfull
      // this.msgService.changeMessage('Úspešne pridaná kategória.');
      this.modalOpen = 2;
      this.modalCase = 0;
      this.dateForm.reset();
      this.toast.success('Date added. Oye!', { position: 'bottom-center' });
    })
    .catch(e => {
      console.log(e);
      this.toast.error('Ayay, something went wrong.', { position: 'bottom-center' });
      // this.msgService.changeMessage(e.message);
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

  //**************************************************************
  //
  //**********************  APPOINTMENT SECTION  ************************
  //
  //**************************************************************

  finishAppointment(appointmentId:string) {
    this.firestore.collection('appointments').doc(appointmentId).update({
      orderState: 1
    })
    .then(() => {
      this.toast.success("Finished! I'm amazing.", { position: 'bottom-center' });
    })
    .catch((e:any) => {
      console.log(e);
      this.toast.error("Oh no manz, something went wrong.", { position: 'bottom-center' });
    });
  }

  finishAllAppointments(appointmentDate:string) {
    const batch = this.firestore.firestore.batch();

    const appointmentsToMove = this.appointmentList.filter((item: any) => item.date === appointmentDate);

    appointmentsToMove.forEach((item: any) => {
      batch.update(this.firestore.firestore.doc(`appointments/${item.id}`), { orderState: 1 });
    });

    const appointmentDateItem = this.dateList.find((x:any) => x.date === appointmentDate);

    batch.delete(this.firestore.firestore.doc(`dates/${appointmentDateItem.id}`));

    batch.commit().then(() => {
      this.toast.success("Finished! I'm amazing.", { position: 'bottom-center' });
    })
    .catch((e:any) => {
      console.log(e);
      this.toast.error("Oh no manz, something went wrong.", { position: 'bottom-center' });
    });
  }
  
  ngOnDestroy() {
    this.dateSubscription.unsubscribe();
    this.timeSubscription.unsubscribe();
  }
}
