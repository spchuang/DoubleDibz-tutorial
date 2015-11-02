# Deployment Documentation

##Alembic migration
```
   alembic revision --autogenerate -m "your message"
   
   #example
   alembic -x env_type=local revision --autogenerate -m "modify User. Allow empty password, make fb_id unique"
   
```

```
   alembic -x env_type=local upgrade head
   -> env_type can be 'local' 'prod' or 'staging'
```


##Deploy to staging

* Resets the entire app folder, /etc folder and clone fresh copy of code. reinstall virtualenv and pip dependencies
```
   fab stage reset
```

* pull code from git and only apply the update (fast)
```
   fab stage up
   -> enter github username/password
```