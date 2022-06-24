import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnInit {
  timeList: any;
  dateList: any;

  constructor() {
  }


  ngOnInit(): void {
  }

  setTimeList(timeList: any) {
    this.timeList = timeList;
  }

  setDateList(dateList: any) {
    this.dateList = dateList;
  }
}
