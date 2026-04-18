package com.bank.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.bank.entity.Account;
import com.bank.repository.AccountRepository;

@Service
public class AccountService {

    @Autowired
    private AccountRepository repo;

    public Account createAccount(Account acc) {
        return repo.save(acc);
    }

    public Account deposit(Long id, double amount) {
        Account acc = repo.findById(id).orElseThrow();
        acc.setBalance(acc.getBalance() + amount);
        return repo.save(acc);
    }

    public Account withdraw(Long id, double amount) {
        Account acc = repo.findById(id).orElseThrow();

        if (acc.getBalance() < amount) {
            throw new RuntimeException("Insufficient Balance");
        }

        acc.setBalance(acc.getBalance() - amount);
        return repo.save(acc);
    }

    public double checkBalance(Long id) {
        return repo.findById(id).orElseThrow().getBalance();
    }
}