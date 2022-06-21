import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/shared/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit, OnDestroy {
  private appointmentSubscription!: Subscription;
  appointmentList: any;
  appointmentListDates: any;
  appointmentListFiltered: any = [];

  selectedItemId: string = '';
  confirmationCase: number = 0;
  modalOpen: number = 0;

  selectedAppointmentDate: string = '';

  constructor(public authService: AuthService, private firestore: AngularFirestore) {
    this.appointmentList = [];
  }

  ngOnInit(): void {
    this.appointmentSubscription = this.firestore.collection('appointments', ref => ref.where('orderState', '==', 1).orderBy('date', 'desc')).valueChanges({idField: 'id'}).subscribe(ss => {
      this.appointmentList = ss;

      // if(this.appointmentList) {
      //   //extract the dates from the appointment list > used for select dropdown values | FILTERING
      //   let result = this.appointmentList.map((item:any) => item.date);
      //   this.appointmentListDates = [...new Set(result)];

      //   if(this.selectedAppointmentDate === '' || this.selectedAppointmentDate === undefined) {
      //     this.selectedAppointmentDate = this.appointmentListDates[0];
      //   }

      //   if(this.selectedAppointmentDate) {
      //     this.appointmentListFiltered = this.appointmentList.filter((item:any) => item.date === this.selectedAppointmentDate);
      //   }
      // }
    });
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
    if(this.confirmationCase === 1) {
      if(this.selectedItemId) {
        this.deleteAppointment(this.selectedItemId);
        this.confirmationCase = 0;
        this.modalOpen = 2;
      }
    }
    if(this.confirmationCase === 2) {
      this.deleteAllAppointments();
      this.confirmationCase = 0;
      this.modalOpen = 2;
    }
  }

  deleteAppointment(appointmentId: string) {
    this.firestore.collection('appointments').doc(appointmentId).delete();
  }

  deleteAllAppointments() {
    this.appointmentList.forEach((appointment:any) => {
      this.firestore.collection('appointments').doc(appointment.appointmentId).delete();
    });
  }

  ngOnDestroy() {
    if(this.appointmentSubscription) {
      this.appointmentSubscription.unsubscribe();
    }
  }
}
