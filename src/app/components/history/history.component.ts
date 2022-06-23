import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/shared/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { HotToastService } from '@ngneat/hot-toast'
// import 'rxjs/add/operator/do';
// import 'rxjs/add/operator/scan';
// import 'rxjs/add/operator/take';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit, OnDestroy {
  private appointmentSubscription!: Subscription;
  appointmentList: any = [];
  // tempArray: any = [];
  // tempInt: number = 5;
  appointmentListDates: any;
  appointmentListFiltered: any = [];

  selectedItemId: string = '';
  confirmationCase: number = 0;
  modalOpen: number = 0;

  selectedAppointmentDate: string = '';

  lastVisible: any;

  constructor(public authService: AuthService, private firestore: AngularFirestore, private toast: HotToastService) {
  }

  ngOnInit(): void {
    this.getHistory();
  }

  scrollHandler(e: any) {
    if(e === 'bottom') {
      this.moreHistory();
    }
  }

  // historyToBeUpdated(date: string) {
  //   let createdAt = new Date()

  //   return this.firestore.firestore.collection('appointments').where('date', '==', date).get().then((docSnapshots: any) => {
  //     this.lastVisible = docSnapshots.docs[docSnapshots.docs.length-1];
  //     docSnapshots.forEach((doc: any) => {
  //       this.firestore.collection('appointments').doc(doc.id).update({createdAt: moment(createdAt).format('yyyy-MM-DD HH:mm:ss')}).then(() => {
  //         console.log('updated')
  //       })
  //     })
  //   });
  // }

  getHistory() {
    this.firestore.firestore.collection('appointments').where('orderState', '==', 1).orderBy('createdAt', 'desc').limit(25).get().then((docSnapshots: any) => {
      this.lastVisible = docSnapshots.docs[docSnapshots.docs.length-1];
      docSnapshots.forEach((doc: any) => {
        var data = doc.data();
        data.id = doc.id;
        this.appointmentList.push(data);
      })
    })
    .catch((e) => {
      console.log(e)
    })
  }

  moreHistory() {
    this.lastVisible && 
    this.firestore.firestore.collection('appointments').where('orderState', '==', 1).orderBy('createdAt', 'desc').limit(25).startAfter(this.lastVisible).get().then((docSnapshots: any) => {
      this.lastVisible = docSnapshots.docs[docSnapshots.docs.length-1];
      docSnapshots.forEach((doc: any) => {
        this.appointmentList.push(doc.data());
      })
    })
    .catch((e) => {
      console.log(e)
    })
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
    this.firestore.collection('appointments').doc(appointmentId).update({orderState: 2}).then(() => {
      this.appointmentList = this.appointmentList.filter((item: any) => { return item.id !== appointmentId });
      console.log(appointmentId);
      this.toast.success('Deleted history item.', { position: 'bottom-center' });
    });
  }

  deleteAllAppointments() {
    this.appointmentList.forEach((appointment:any) => {
      this.firestore.collection('appointments').doc(appointment.appointmentId).update({orderState: 2}).then(() => {
        this.appointmentList = this.appointmentList.filter((item: any) => { return item.id !== appointment.appointmentId })
      });
    });
    
    this.toast.success('Deleted history.', { position: 'bottom-center' });
  }

  ngOnDestroy() {
    if(this.appointmentSubscription) {
      this.appointmentSubscription.unsubscribe();
    }
  }
}
