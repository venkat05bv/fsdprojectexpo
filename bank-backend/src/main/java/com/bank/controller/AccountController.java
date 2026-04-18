package com.bank.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bank.entity.Account;
import com.bank.service.AccountService;

@RestController
@RequestMapping("/api/account")
@CrossOrigin("*")
public class AccountController {

    @Autowired
    private AccountService service;

    @PostMapping("/create")
    public Account create(@RequestBody Account acc) {
        return service.createAccount(acc);
    }

    @PostMapping("/deposit/{id}/{amount}")
    public Account deposit(@PathVariable Long id, @PathVariable double amount) {
        return service.deposit(id, amount);
    }

    @PostMapping("/withdraw/{id}/{amount}")
    public Account withdraw(@PathVariable Long id, @PathVariable double amount) {
        return service.withdraw(id, amount);
    }

    @GetMapping("/balance/{id}")
    public double balance(@PathVariable Long id) {
        return service.checkBalance(id);
    }
}