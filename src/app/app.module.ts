import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SwiperModule } from 'swiper/angular';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';
import { HttpClientModule } from '@angular/common/http';


import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from "@angular/forms";

import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from "@angular/fire/auth";
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFirestoreModule } from '@angular/fire/firestore';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './components/login/login.component';
import { AuthService } from './shared/auth.service';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PagenotfoundComponent } from './components/pagenotfound/pagenotfound.component';
import { AppointmentComponent } from './components/appointment/appointment.component';
import { HistoryComponent } from './components/history/history.component';
import { ScrollableDirective } from './scrollable.directive';
import { HotToastModule } from '@ngneat/hot-toast';
import { AppointmentsComponent } from './components/dashboard/appointments/appointments.component';
import { TimeManagerComponent } from './components/dashboard/time-manager/time-manager.component';
import { DateManagerComponent } from './components/dashboard/date-manager/date-manager.component';
import { NavAdminComponent } from './components/nav-admin/nav-admin.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    DashboardComponent,
    PagenotfoundComponent,
    AppointmentComponent,
    HistoryComponent,
    ScrollableDirective,
    AppointmentsComponent,
    TimeManagerComponent,
    DateManagerComponent,
    NavAdminComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    SwiperModule,
    MatSelectModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    // AngularFirestoreModule,
    AngularFirestoreModule.enablePersistence(),
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    HotToastModule.forRoot(),
  ],
  providers: [AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
