import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { SwiperComponent } from "swiper/angular";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";

import { AngularFirestore } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// import Swiper core and required modules
import SwiperCore, { Mousewheel, Pagination } from "swiper/core";
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { HotToastService } from '@ngneat/hot-toast';

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
  selectedDate: any;
  selectedTime: any;
  isDateSelected: boolean = false;
  isTimeSelected: boolean = false;
  isSameDay: boolean = false;
  appointmentForm: FormGroup;

  dateList: any;
  timeList: any;

  timeListFiltered: any;

  private dateSubscription!: Subscription;
  private timeSubscription!: Subscription;

  constructor(private firestore: AngularFirestore, private fb: FormBuilder, private http: HttpClient, private router: Router, private toast: HotToastService) { 
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

      this.dateList && this.patchValuesToForm();
    });

    this.timeSubscription = this.firestore.collection('hours', ref => ref.where('available', '==', true).orderBy('hour', 'asc')).valueChanges({idField: 'id'}).subscribe(ss => {
      this.timeList = ss;
      if(this.dateList) {
        // this.checkExpiredHours(this.dateList, this.timeList);
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
          
          // this.checkExpiredHours(this.dateList, this.timeListFiltered);
        }
      }
    });

  }

  checkExpiredHours(dateList: any, timeList: any) {
    let date = new Date();
    let dateNow = moment(date).format('DD/MM/YYYY');
    let timeNow = moment(date).format('h:mm');
    const batch = this.firestore.firestore.batch();

    dateList.forEach((dateItem: any) => {
      if(dateItem.date === dateNow) {
        timeList.forEach((timeItem: any) => {
          if(timeItem.dateId === dateItem.id && timeNow > timeItem.hour) {
            batch.delete(this.firestore.firestore.doc(`hour/${timeItem.id}`))
            if(dateItem.availableTimes === 1) {
              batch.update(this.firestore.firestore.doc(`date/${dateItem.id}`), { availableTimes: 0, available: false })
            }
            if(dateItem.availableTimes > 1) {
              batch.update(this.firestore.firestore.doc(`date/${dateItem.id}`), { availableTimes: dateItem.availableTimes-- })
            }
          }
        })
      }
    })

    batch.commit().catch((e: any) => {
      console.log(e);
    })
  }
  
  next() {
    this.formState++;
  }
  
  back() {
    this.formState--;
  }

  patchValuesToForm() {
    var data: any = localStorage.getItem('formPrefill')
    data = JSON.parse(data);

    if(data) {
      this.appointmentForm.patchValue({
        fullName: data.fullName,
        phoneNo: data.phoneNo,
        email: data.email,
      })
    }
  }

  setFormPrefill() {
    const data = {
      fullName: this.appointmentForm.value.fullName,
      phoneNo: this.appointmentForm.value.phoneNo,
      email: this.appointmentForm.value.email,
    }

    localStorage.setItem('formPrefill', JSON.stringify(data));
  }

  slideTo(index: number) {
    this.swiperRef?.swiperRef.slideTo(index - 1, 500);
  }

  onDateSelected(event: any) {
    const dateId = event.value;
    let dateNow = new Date().toDateString();
    dateNow = moment(dateNow).format('YYYY-MM-DD');

    this.selectedDate = this.dateList.find((item: any) => item.id === dateId);
    let dateToCompare = this.selectedDate.date;
    dateToCompare = moment(dateToCompare, 'DD/MM/YYYY').format('YYYY-MM-DD');

    if(moment(dateNow).isAfter(dateToCompare)) {
      this.toast.error('Nie je možné si rezervovať vybraný dátum.', { position: 'bottom-center' });
      this.isDateSelected = false;
    } else {
      this.isDateSelected = true;
    }

    if(dateNow === dateToCompare) {
      this.isSameDay = true;
    } else {
      this.isSameDay = false;
    }

    this.timeListFiltered = this.timeList.filter((x:any) => x.dateId === dateId);
  }

  onTimeSelected(event: any) {
    const timeId = event.value;
    let dateNow = new Date();
    let timeNow = moment(dateNow).format('h:mm');

    this.selectedTime = this.timeList.find((item: any) => item.id === timeId);
    let timeToCompare = moment(this.selectedTime.hour, 'h:mm').format('h:mm');

    if(this.isSameDay === true) {
      if(timeNow > timeToCompare) {
        this.toast.error('Nie je možné si rezervovať vybraný čas.', { position: 'bottom-center' });
        this.isTimeSelected = false;
      } else {
        this.isTimeSelected = true;
      }
    } else {
      this.isTimeSelected = true;
    }
  }

  createAppointment() {
    let createdAt = new Date()
    let Record = {
      dateId: this.appointmentForm.get('date')?.value,
      timeId: this.appointmentForm.get('time')?.value,
      fullName: this.appointmentForm.value.fullName,
      phoneNo: this.appointmentForm.value.phoneNo,
      email: this.appointmentForm.value.email,
      createdAt: moment(createdAt).format('yyyy-MM-DD HH:mm:ss')
    }

    const headers = {
      'Content-Type' : 'application/json'
    }

    this.loading = true;
    this.setFormPrefill();

    // this.router.navigate(['termin'], {queryParams: {fullName: Record.fullName, date: this.selectedDate.date, time: this.selectedTime.hour}});

    // https://us-central1-demko-barber.cloudfunctions.net/app/api/dates
    // https://us-central1-demko-barber.cloudfunctions.net/app
    this.http.post<any>('https://europe-west1-demko-barber.cloudfunctions.net/createAppointment', JSON.stringify(Record), {headers}).subscribe({
      next: (data:any) => {
        this.router.navigate(['termin'], { queryParams: {fullName: data.fullName, date: data.date, time: data.time } });
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
