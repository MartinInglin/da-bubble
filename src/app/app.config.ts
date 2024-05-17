import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'da-bubble-bb34a',
        appId: '1:396194731081:web:eba0ccc11274e62e9a5b98',
        storageBucket: 'da-bubble-bb34a.appspot.com',
        apiKey: 'AIzaSyDi_vsxF7O51XBUbMubX5scAdQMGOivevw',
        authDomain: 'da-bubble-bb34a.firebaseapp.com',
        messagingSenderId: '396194731081',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
  ],
};
