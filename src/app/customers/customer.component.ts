import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms';

import { debounceTime } from 'rxjs/operators';

import { Customer } from './customer';

// 3.Cross-Field Validation function for nested group with fb form builder email confirmation, needs to be nested group
function emailMatcher(c: AbstractControl) {
  let emailControl = c.get('email');
  let confirmControl = c.get('confirmEmail');

  if ( emailControl.pristine || confirmControl.pristine) {
    return null;
  }
  if ( emailControl.value == confirmControl.value) {
    return null;
  }
  return { 'match': true};
}

// 2.Custom validator funciton with parameters
//   warepped in a factory function
function ratingRange(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (c.value != undefined && (isNaN(c.value) || c.value < min || c.value > max)) {
      return { 'range': true };
    }
    return null;
  };
}

// 1.Regular Custom validator funciton
function ratingRangeNormal(c: AbstractControl): { [key: string]: boolean } | null {
  if (c.value != undefined && (isNaN(c.value) || c.value < 1 || c.value > 5)) {
    return { 'range': true };
  }
  return null;
};

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customerForm: FormGroup;
  customer: Customer = new Customer();
  emailMessage: string;

  private validationMessages = {
    required: 'Please enter your email address.',
    pattern: 'Please enter a valid email address.'
  };

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      // firstName: {value: 'n/a', disabled: true}, // Otra forma de definir valor inicial en formbuilder
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.fb.group({
        email: ['', [Validators.required, /*Validators.email*/ Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$') ]],
        confirmEmail: ['', Validators.required ],
      }, { validator: emailMatcher }),
      phone: '',
      sendCatalog: { value: true, disabled: true },
      rating: ['', ratingRange(1,5)],
      notification: 'email'
    });

    /*     this.customerForm = new FormGroup({
          firstName: new FormControl(),
          lastName: new FormControl(),
          email: new FormControl(),
          sendCatalog: new FormControl(true),
        }); */

    // Reacting to changes instead of using click event for the notification control
    this.customerForm.get('notification').valueChanges
                     .subscribe(value => { 
                       console.log(value);
                       this.setNotification(value);
                      }); 

    // Setting up reacting validation messages
    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(value => {
      this.setMessage(emailControl);
    });
  }

  populateTestData(): void {
    this.customerForm.setValue({ // Setvalue es para todos los campos, pathvalue sólo para unos cuantos
      firstName: 'Jack',
      lastName: 'Harkness',
      email: 'jack@torchwood.com',
      sendCatalog: false,
    });
  }

  save() {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm));
  }

  // used with click event or watcher subscribed to changes in oninit method
  setNotification(notifyVia: string): void { // Adjust validations at runtime removing and adding valition
    const phoneControl = this.customerForm.get('phone');
    if (notifyVia == 'text') {
      phoneControl.setValidators(Validators.required);
    } else {
      phoneControl.clearValidators();
    }
    phoneControl.updateValueAndValidity();
  }

  // Function to set up validaton messages that will react to changes
  // Didnt work so well, email validation always true, required validation only after pristine true
  // if using validator email and not pattern
  setMessage(c: AbstractControl): void {
    this.emailMessage = '';
    console.log(c.touched);
    console.log(c.dirty);
    console.log(c.errors);
    console.log(c);
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors).map(key =>
        this.validationMessages[key]).join(' ');
    }
  
  }
}
