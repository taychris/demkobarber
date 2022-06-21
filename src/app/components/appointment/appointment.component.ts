import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.scss']
})
export class AppointmentComponent implements OnInit, OnDestroy {
  appointmentId: any;
  private appointmentSubscription!: Subscription;
  appointment: any;
  questions: boolean = false;

  constructor(private firestore: AngularFirestore, private activatedRoute: ActivatedRoute,) {
    this.appointmentId = this.activatedRoute.snapshot.paramMap.get('id');
   }

  ngOnInit(): void {
    if(this.appointmentId !== undefined) {
      this.appointmentSubscription = this.firestore.collection('appointments').doc(this.appointmentId).valueChanges().subscribe(data => {
        this.appointment = data;
      });
    }
  }

  showQuestions() {
    this.questions = !this.questions;
  }

  ngOnDestroy() {
    if(this.appointmentSubscription) {
      this.appointmentSubscription.unsubscribe();
    }
  }
}
