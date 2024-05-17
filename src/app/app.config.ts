import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { routes } from './app.routes';

const firebaseConfig = {
  apiKey: "AIzaSyDi_vsxF7O51XBUbMubX5scAdQMGOivevw",
  authDomain: "da-bubble-bb34a.firebaseapp.com",
  projectId: "da-bubble-bb34a",
  storageBucket: "da-bubble-bb34a.appspot.com",
  messagingSenderId: "396194731081",
  appId: "1:396194731081:web:eba0ccc11274e62e9a5b98"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    importProvidersFrom([
      provideFirebaseApp(() => initializeApp(firebaseConfig)),
      provideAuth(() => getAuth()),
      provideFirestore(() => getFirestore()),
      provideStorage(() => getStorage())
    ]),
  ],
};