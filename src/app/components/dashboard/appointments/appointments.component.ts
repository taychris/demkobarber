import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { HotToastService } from '@ngneat/hot-toast';
import * as moment from 'moment';

@Component({
  selector: 'appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  appointmentSubscription!: Subscription;
  appointmentList: any;
  appointmentListDates: any;
  selectedAppointmentDate!: string;
  appointmentListFiltered: any = [];

  selectedItemId!: string;
  confirmationCase!: number;
  modalOpen!: number;

  @Input() dateList: any;

  constructor(private firestore: AngularFirestore, private toast: HotToastService) { }

  ngOnInit(): void {
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

  deleteConfirmationModal(caseNo: number, itemId: string) {//setting the selected item id, when there is an item to delete
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
    this.appointmentSubscription && this.appointmentSubscription.unsubscribe();
  }
}
