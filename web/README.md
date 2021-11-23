## Web Application

This section is for the web application which is deployed to the Ohmni robot via https://app.ohmnilabs.com/my-robots. The following subsections give instructions on setting up the project locally.

### Web-App Prerequisites

Clone down this repository. You will need node and npm installed globally on your machine. You can find the download page at [Nodejs Homepage](https://nodejs.org/en/)

- Make sure your npm is the latest

  ```sh
  npm install npm@latest -g
  ```

- A Firebase project for the web framework, you can create one at [Firebase Homepage](https://firebase.google.com/)

- MQTT Broker, e.g. Adafruit

### Web-App Installation

Change directory to `web`.

```sh
cd web
```

If you are running the project for the first time, install all the dependencies

```sh
npm install
```

For the Firebase project, register your web app with steps follow [Firebase register app](https://firebase.google.com/docs/web/setup#register-app). For the Firebase config variable, go to Project Setting, under Your Apps section.

Prepare your environment by renaming the .env.example to .env with your variables

| Variable                          | Value                          |
| --------------------------------- | ------------------------------ |
| REACT_APP_FIREBASE_API_KEY        | apiKey                         |
| REACT_APP_FIREBASE_AUTH_DOMAIN    | authDomain                     |
| REACT_APP_FIREBASE_PROJECT_ID     | projectId                      |
| REACT_APP_FIREBASE_STORAGE_BUCKET | storageBucket                  |
| REACT_APP_FIREBASE_MESS_SENDER_ID | messagingSenderId              |
| REACT_APP_FIREBASE_APP_ID         | appId                          |
| REACT_APP_MQTT_SECRET             | _\<your MQTT Secret, if any\>_ |

When they're all set run the project locally

```sh
 npm start
```

### Web-App Usage & Test

When you first access the page, you need to provide the MQTT config: input the topic name to subscribe, host, port, clientid, username, and password (if any). There is a pre-filled example in the Demo so you can quickly use it to test.

Next, choose the medical check-in type, there are two options:

- Register: register for a new patient
- Retrieve: for the old patient, retrieve medical checkup

In the Register option, fill all the needed information and continue. In the Retrieve one, input the phone number to retrieve all the previous information.

At the very bottom, there are the status of the MQTT Client and the current accuracy of the robot. There is a button "MQTT Test", link to another page, to explicitly test your connection.