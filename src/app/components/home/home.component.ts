import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { SwiperComponent } from "swiper/angular";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";

import { AngularFirestore } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// import Swiper core and required modules
import SwiperCore, { Mousewheel, Pagination } from "swiper/core";
import { Subscription } from 'rxjs';

// install Swiper modules
SwiperCore.use([Mousewheel, Pagination]);

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild("swiperRef", { static: false }) swiperRef?: SwiperComponent;
  formState: number = 0;
  loading: boolean = false;
  selectedDateId!: string;
  appointmentForm: FormGroup;

  dateList: any;
  timeList: any;

  timeListFiltered: any;

  private dateSubscription!: Subscription;
  private timeSubscription!: Subscription;

  constructor(private firestore: AngularFirestore, private fb: FormBuilder, private http: HttpClient, private router: Router) { 
    this.appointmentForm = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      fullName: ['', Validators.required],
      phoneNo: ['', Validators.required],
      email: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.dateSubscription = this.firestore.collection('dates', ref => ref.where('available', '==', true).orderBy('date', 'asc')).valueChanges({idField: 'id'}).subscribe(ss => {
      this.dateList = ss;
      //sort the dates by starting with the oldest date
      this.dateList.sort((a:any, b:any) => {
        var aa = a.date.split('/').reverse().join(),
            bb = b.date.split('/').reverse().join();
        return aa < bb ? -1 : (aa > bb ? 1 : 0);
      });


    });

    this.timeSubscription = this.firestore.collection('hours', ref => ref.where('available', '==', true).orderBy('hour', 'asc')).valueChanges({idField: 'id'}).subscribe(ss => {
      this.timeList = ss;
      if(this.dateList) {
        if(this.selectedDateId) {
          //if a specific date was chosen, only show the hours corresponding to the date selected & is not empty
          if(this.timeList.length > 0) {
            this.timeListFiltered = this.timeList.filter((x:any) => x.dateId == this.selectedDateId);
          }
        } else {
          //if no specific date was chosen by the user, as default, show hours corresponding to the first date in the list & is not empty
          if(this.timeList.length > 0) {
            this.timeListFiltered = this.timeList.filter((x:any) => x.dateId == this.dateList[0].id);
          }
        }
        //sort list by ascending hours & if not empty
        if(this.timeListFiltered) {
          this.timeListFiltered = this.timeListFiltered.sort((a:any, b:any) => a.hour.localeCompare(b.hour));
        }
      }
    });
  }
  
  next() {
    this.formState = this.formState + 1;
  }
  
  back() {
    this.formState = this.formState - 1;
  }

  slideTo(index: number) {
    this.swiperRef?.swiperRef.slideTo(index - 1, 0);
  }

  onDateSelected(event: any) {
    console.log(event.value);
    this.timeListFiltered = this.timeList.filter((x:any) => x.dateId === event.value);
  }

  createAppointment() {
    let Record = {
      dateId: this.appointmentForm.get('date')?.value,
      timeId: this.appointmentForm.get('time')?.value,
      fullName: this.appointmentForm.value.fullName,
      phoneNo: this.appointmentForm.value.phoneNo,
      email: this.appointmentForm.value.email,
    }

    const headers = {
      'Content-Type' : 'application/json'
    }

    this.loading = true;

    //https://us-central1-demko-barber.cloudfunctions.net/app/api/dates
    //http://localhost:5000/demko-barber/us-central1/app
    this.http.post<any>('https://us-central1-demko-barber.cloudfunctions.net/app/api/dates', JSON.stringify(Record), {headers}).subscribe({
      next: (data:any) => {
        this.router.navigate(['/termin', data.appointmentId]);
      },
      error: (error:any) => {
        // this.msgService.changeMessage(error.message);
        this.loading = false;
        console.log(error.message);
      }
    });
  }

  ngOnDestroy() {
    this.dateSubscription.unsubscribe();
    this.timeSubscription.unsubscribe();
  }

}