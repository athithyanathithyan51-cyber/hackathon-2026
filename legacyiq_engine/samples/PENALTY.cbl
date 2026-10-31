       IDENTIFICATION DIVISION.
       PROGRAM-ID. PENALTY-CALC.
      *================================================================*
      * LEGACY COBOL BANKING APPLICATION: MINIMUM BALANCE PENALTY LOGIC *
      *================================================================*
       ENVIRONMENT DIVISION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-BALANCE           PIC 9(7)V99.
       01  WS-PENALTY-AMOUNT    PIC 9(4)V99 VALUE 0.
       01  WS-ACCOUNT-STATUS    PIC X(10)   VALUE 'ACTIVE'.

       PROCEDURE DIVISION.
       0000-MAIN-PROCESS.
           PERFORM 1000-CALCULATE-PENALTY.
           PERFORM 2000-APPLY-PENALTY.
           STOP RUN.

       1000-CALCULATE-PENALTY.
           IF WS-BALANCE < 1000
               MOVE 50 TO WS-PENALTY-AMOUNT
           ELSE
               MOVE 0 TO WS-PENALTY-AMOUNT
           END-IF.

       2000-APPLY-PENALTY.
           IF WS-PENALTY-AMOUNT > 0
               PERFORM 3000-LOG-TRANSACTION
           END-IF.

       3000-LOG-TRANSACTION.
           MOVE 1 TO WS-ACCOUNT-STATUS.
