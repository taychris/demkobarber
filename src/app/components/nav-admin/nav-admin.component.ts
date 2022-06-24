import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/auth.service';

@Component({
  selector: 'nav-admin',
  templateUrl: './nav-admin.component.html',
  styleUrls: ['./nav-admin.component.scss']
})
export class NavAdminComponent implements OnInit {
  href: string = "";

  constructor(private router: Router, public authService: AuthService) { }

  ngOnInit(): void {
    this.href = this.router.url;
  }

}
