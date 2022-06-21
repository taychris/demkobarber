import { Injectable, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { User } from './models/user';
import firebase from "firebase/app";
import "firebase/auth";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Router } from "@angular/router";
import { isPlatformBrowser } from '@angular/common';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  userData: any; // Save logged in user data
  currentUser!: User;
  userCheck: any;

  constructor( 
    public afs: AngularFirestore,   // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public router: Router,  
    public ngZone: NgZone, // NgZone service to remove outside scope warning
    @Inject(PLATFORM_ID) private platformId: Object
    ) { 
      this.afAuth.authState.subscribe(user => {
        if (user) {
          this.userData = {
            displayName: user.providerData[0]?.displayName,
            email: user.providerData[0]?.email,
            uid: user.uid
          }
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('user', JSON.stringify(this.userData));
          }
         } else {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('user', '{}');
            JSON.parse(localStorage.getItem('user') || '{}');
          }
         }
       });
  }

  SignUp(email: any, password: any, name: any, phoneNumber: any) {
    return this.afAuth.createUserWithEmailAndPassword(email, password)
    .then(result => {
      const user = result.user;

      if(user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: name,
          photoURL: '',
          emailVerified: user.emailVerified,
          phoneNumber: phoneNumber,
        }

        user.updateProfile({
          displayName: name
        });

        this.SendVerificationMail();
        this.afs.collection("users").doc(user.uid).set(this.currentUser);
      }

    }).catch(error => {
      window.alert(error.message);
    });
  }

  SendVerificationMail() {
    this.afAuth.currentUser.then(u => u?.sendEmailVerification()).then(() => {
      window.alert("Úspešne ste sa zaregistrovali. Poslali sme vám email, prosím potvrďte zadaný email.");
    }); 
  }

  SignIn(email: any, password: any) {
    return this.afAuth.signInWithEmailAndPassword(email, password)
      .then((result) => {
        this.ngZone.run(() => {
          this.router.navigate(['dashboard']);
        });
      }).catch((error) => {
        window.alert(error.message)
      })
  }

  // Sign in with Google
  GoogleAuth() {
    return this.AuthLogin(new firebase.auth.GoogleAuthProvider());
  }

  // Auth logic to run auth providers
  AuthLogin(provider: any) {
    return this.afAuth.signInWithPopup(provider)
    .then((result) => {
       this.ngZone.run(() => {
          this.router.navigate(['/']);
        })
      this.SetUserData(result.user);
    }).catch((error) => {
      window.alert(error)
    })
  }

  /* Setting up user data when sign in with username/password, 
  sign up with username/password and sign in with social auth  
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  SetUserData(user: any) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
    }
    return userRef.set(userData, {
      merge: true
    })
  }

  // Sign out 
  SignOut() {
    return this.afAuth.signOut().then(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('user');
        this.router.navigate(['admin']);
      }
    })
  }
}
