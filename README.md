# IQNet-Server

## How to push updates and deploy:
- Push the latest code.
- Login to server.
- Execute the following commands.
    -
  `sudo su`
  
  `cd IQNet-Server`
  
  `git pull` give your GitUserName and GitAuthKey
  
  Check deployed branch: `git branch`
  
  Change brach if needed: `git checkout <branch_name>`
  
  `pm2 restart index`
  
## How to push updates and debug:
- Push the latest code.
- Login to server.
- Execute the following commands.
    -
  `sudo su`
  
  `cd IQNet-Server`
  
  `git pull` give your GitUserName and GitAuthKey
  
  Check deployed branch: `git branch`
  
  Change brach if needed: `git checkout <branch_name>`
  
  `pm2 stop index`

  `npm i`

  `npm start` and debug the outputs.

  After debugging stop the running server with `Ctrl + C` then execute `pm2 start index`

## How to change something on .env only:
  - Execute the following commands.
    -
  `sudo su`
  
  `cd IQNet-Server`

  `nano .env` and edit the .env file. After editing save it with `Ctrl + O` then `Enter`. Then close the editor with `Ctrl + X`

  `pm2 restart index`
