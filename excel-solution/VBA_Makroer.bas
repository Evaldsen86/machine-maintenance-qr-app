Attribute VB_Name = "OpgaveSortering"
' =============================================================================
' VBA MAKROER TIL SAFFIORFIK A/S OPGAVESTYRING
' =============================================================================
' Denne modul indeholder makroer til automatisk sortering af opgaver
' baseret på status-kolonnen.
' =============================================================================

Option Explicit

' -----------------------------------------------------------------------------
' AUTOMATISK SORTERING VED STATUSÆNDRING
' -----------------------------------------------------------------------------
' Denne makro sorterer automatisk Opgaveoversigt-arket når status ændres
' Sorteringsrækkefølge: 
'   1. Færdig - kan faktureres (højeste prioritet)
'   2. Igangværende
'   3. Færdig - faktureret
'   4. Mangler reservedele
'   5. Planlagt (laveste prioritet)
' -----------------------------------------------------------------------------

Sub SorterOpgaver()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim sortRange As Range
    
    ' Sæt reference til Opgaveoversigt-arket
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("Opgaveoversigt")
    On Error GoTo 0
    
    If ws Is Nothing Then
        MsgBox "Kunne ikke finde 'Opgaveoversigt' arket!", vbExclamation
        Exit Sub
    End If
    
    ' Find sidste række med data
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    
    ' Hvis der er mindre end 2 rækker (kun overskrift), afslut
    If lastRow < 3 Then Exit Sub
    
    ' Definer sorteringsområdet (fra række 2 til sidste række)
    Set sortRange = ws.Range("A2:M" & lastRow)
    
    ' Deaktiver advarsler midlertidigt
    Application.ScreenUpdating = False
    Application.DisplayAlerts = False
    
    ' Opretter brugerdefineret sorteringsliste
    Dim statusOrder As Variant
    statusOrder = Array("Færdig - kan faktureres", "Igangværende", "Færdig - faktureret", "Mangler reservedele", "Planlagt")
    
    ' Tilføj brugerdefineret liste hvis den ikke eksisterer
    On Error Resume Next
    Application.AddCustomList ListArray:=statusOrder
    On Error GoTo 0
    
    ' Udfør sortering
    ws.Sort.SortFields.Clear
    
    ' Sorter efter Status-kolonnen (kolonne I = 9)
    ws.Sort.SortFields.Add2 _
        Key:=ws.Range("I2:I" & lastRow), _
        SortOn:=xlSortOnValues, _
        Order:=xlAscending, _
        CustomOrder:=Join(statusOrder, ","), _
        DataOption:=xlSortNormal
    
    With ws.Sort
        .SetRange sortRange
        .Header = xlNo
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
    
    ' Genaktiver advarsler
    Application.ScreenUpdating = True
    Application.DisplayAlerts = True
    
End Sub


' -----------------------------------------------------------------------------
' AUTOMATISK SORTERING VED CELLEÆNDRING (WORKSHEET EVENT)
' -----------------------------------------------------------------------------
' Denne kode skal placeres i Opgaveoversigt worksheet-modulet
' For at tilføje: Højreklik på Opgaveoversigt fane → Vis kode → Indsæt nedenstående
' -----------------------------------------------------------------------------
'
' Private Sub Worksheet_Change(ByVal Target As Range)
'     ' Tjek om ændringen er i Status-kolonnen (kolonne I)
'     If Not Intersect(Target, Me.Range("I:I")) Is Nothing Then
'         ' Kør sorteringsmakro
'         Application.EnableEvents = False
'         SorterOpgaver
'         Application.EnableEvents = True
'     End If
'     
'     ' Automatisk opdater % Complete hvis Slutdato udfyldes
'     If Not Intersect(Target, Me.Range("H:H")) Is Nothing Then
'         Dim cell As Range
'         For Each cell In Intersect(Target, Me.Range("H:H"))
'             If cell.Value <> "" And cell.Row > 1 Then
'                 Me.Cells(cell.Row, 10).Value = "100%"  ' Kolonne J = % Complete
'             End If
'         Next cell
'     End If
' End Sub


' -----------------------------------------------------------------------------
' MANUEL SORTERINGSKNAP
' -----------------------------------------------------------------------------
' Opret en knap på arket og tildel denne makro
' -----------------------------------------------------------------------------

Sub ManuelSortering()
    Call SorterOpgaver
    MsgBox "Opgaver er sorteret!", vbInformation, "Sortering fuldført"
End Sub


' -----------------------------------------------------------------------------
' GENERER NÆSTE OPGAVE ID
' -----------------------------------------------------------------------------
' Hjælpefunktion til at generere næste ledige Opgave ID
' -----------------------------------------------------------------------------

Function NæsteOpgaveID() As String
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim lastID As String
    Dim idNumber As Long
    
    Set ws = ThisWorkbook.Worksheets("Opgaveoversigt")
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    
    If lastRow < 2 Then
        NæsteOpgaveID = "OP-001"
    Else
        lastID = ws.Cells(lastRow, 1).Value
        ' Udtræk nummer fra ID (f.eks. "OP-123" → 123)
        idNumber = Val(Right(lastID, 3)) + 1
        NæsteOpgaveID = "OP-" & Format(idNumber, "000")
    End If
End Function


' -----------------------------------------------------------------------------
' GENERER NÆSTE VÆRKTØJS ID
' -----------------------------------------------------------------------------
' Hjælpefunktion til at generere næste ledige Værktøjs ID
' -----------------------------------------------------------------------------

Function NæsteVærktøjsID() As String
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim lastID As String
    Dim idNumber As Long
    
    Set ws = ThisWorkbook.Worksheets("Værktøjsoversigt")
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    
    If lastRow < 2 Then
        NæsteVærktøjsID = "VT-001"
    Else
        lastID = ws.Cells(lastRow, 1).Value
        ' Udtræk nummer fra ID (f.eks. "VT-123" → 123)
        idNumber = Val(Right(lastID, 3)) + 1
        NæsteVærktøjsID = "VT-" & Format(idNumber, "000")
    End If
End Function


' -----------------------------------------------------------------------------
' OPDATER ALLE BETINGEDE FORMATERINGER
' -----------------------------------------------------------------------------
' Tilføjer farvekodning til Opgaveoversigt baseret på status
' -----------------------------------------------------------------------------

Sub TilføjFarvekodning()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim dataRange As Range
    
    Set ws = ThisWorkbook.Worksheets("Opgaveoversigt")
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    
    If lastRow < 2 Then Exit Sub
    
    Set dataRange = ws.Range("A2:M" & lastRow)
    
    ' Fjern eksisterende betinget formatering
    dataRange.FormatConditions.Delete
    
    ' Planlagt - Lysgul (#FFFF99)
    With dataRange.FormatConditions.Add(Type:=xlExpression, Formula1:="=$I2=""Planlagt""")
        .Interior.Color = RGB(255, 255, 153)
        .StopIfTrue = False
    End With
    
    ' Igangværende - Lysblå (#ADD8E6)
    With dataRange.FormatConditions.Add(Type:=xlExpression, Formula1:="=$I2=""Igangværende""")
        .Interior.Color = RGB(173, 216, 230)
        .StopIfTrue = False
    End With
    
    ' Mangler reservedele - Lysrød (#FFB6C1)
    With dataRange.FormatConditions.Add(Type:=xlExpression, Formula1:="=$I2=""Mangler reservedele""")
        .Interior.Color = RGB(255, 182, 193)
        .StopIfTrue = False
    End With
    
    ' Færdig - kan faktureres - Lysgrøn (#90EE90)
    With dataRange.FormatConditions.Add(Type:=xlExpression, Formula1:="=$I2=""Færdig - kan faktureres""")
        .Interior.Color = RGB(144, 238, 144)
        .StopIfTrue = False
    End With
    
    ' Færdig - faktureret - Mørkegrøn (#228B22) med hvid tekst
    With dataRange.FormatConditions.Add(Type:=xlExpression, Formula1:="=$I2=""Færdig - faktureret""")
        .Interior.Color = RGB(34, 139, 34)
        .Font.Color = RGB(255, 255, 255)
        .Font.Bold = True
        .StopIfTrue = False
    End With
    
    MsgBox "Farvekodning er tilføjet!", vbInformation
End Sub


' -----------------------------------------------------------------------------
' TILFØJ FARVEKODNING TIL VÆRKTØJSOVERSIGT
' -----------------------------------------------------------------------------

Sub TilføjVærktøjsFarvekodning()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim dataRange As Range
    
    Set ws = ThisWorkbook.Worksheets("Værktøjsoversigt")
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    
    If lastRow < 2 Then Exit Sub
    
    Set dataRange = ws.Range("A2:K" & lastRow)
    
    ' Fjern eksisterende betinget formatering
    dataRange.FormatConditions.Delete
    
    ' Status = Udstedt - Lysgul (#FFFF99)
    With dataRange.FormatConditions.Add(Type:=xlExpression, Formula1:="=$E2=""Udstedt""")
        .Interior.Color = RGB(255, 255, 153)
        .StopIfTrue = False
    End With
    
    ' Status = Returneret - Lysgrøn (#90EE90)
    With dataRange.FormatConditions.Add(Type:=xlExpression, Formula1:="=$E2=""Returneret""")
        .Interior.Color = RGB(144, 238, 144)
        .StopIfTrue = False
    End With
    
    ' Type = Elektrisk - Lysblå (#ADD8E6)
    With dataRange.FormatConditions.Add(Type:=xlExpression, Formula1:="=$C2=""Elektrisk""")
        .Interior.Color = RGB(173, 216, 230)
        .StopIfTrue = False
    End With
    
    MsgBox "Værktøjsfarvekodning er tilføjet!", vbInformation
End Sub


' -----------------------------------------------------------------------------
' INITIALISER ALLE DROPDOWNS
' -----------------------------------------------------------------------------
' Opretter datavalidering (dropdowns) for alle relevante kolonner
' -----------------------------------------------------------------------------

Sub InitialiserDropdowns()
    Dim wsOpgave As Worksheet
    Dim wsVærktøj As Worksheet
    Dim wsLister As Worksheet
    Dim lastRowOpgave As Long
    Dim lastRowVærktøj As Long
    
    Set wsOpgave = ThisWorkbook.Worksheets("Opgaveoversigt")
    Set wsVærktøj = ThisWorkbook.Worksheets("Værktøjsoversigt")
    Set wsLister = ThisWorkbook.Worksheets("Lister")
    
    lastRowOpgave = wsOpgave.Cells(wsOpgave.Rows.Count, "A").End(xlUp).Row + 100
    lastRowVærktøj = wsVærktøj.Cells(wsVærktøj.Rows.Count, "A").End(xlUp).Row + 100
    
    ' OPGAVEOVERSIGT DROPDOWNS
    ' -------------------------
    
    ' Medarbejder dropdown (kolonne D)
    With wsOpgave.Range("D2:D" & lastRowOpgave).Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, _
             Formula1:="=Lister!$A$2:$A$15"
        .ShowError = True
    End With
    
    ' Kunde dropdown (kolonne E)
    With wsOpgave.Range("E2:E" & lastRowOpgave).Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, _
             Formula1:="=Lister!$C$2:$C$200"
        .ShowError = True
    End With
    
    ' Status dropdown (kolonne I)
    With wsOpgave.Range("I2:I" & lastRowOpgave).Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, _
             Formula1:="=Lister!$B$2:$B$6"
        .ShowError = True
    End With
    
    ' VÆRKTØJSOVERSIGT DROPDOWNS
    ' ---------------------------
    
    ' Type dropdown (kolonne C)
    With wsVærktøj.Range("C2:C" & lastRowVærktøj).Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, _
             Formula1:="=Lister!$D$2:$D$3"
        .ShowError = True
    End With
    
    ' PPR (Medarbejder) dropdown (kolonne D)
    With wsVærktøj.Range("D2:D" & lastRowVærktøj).Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, _
             Formula1:="=Lister!$A$2:$A$15"
        .ShowError = True
    End With
    
    ' Status dropdown (kolonne E)
    With wsVærktøj.Range("E2:E" & lastRowVærktøj).Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, _
             Formula1:="=Lister!$E$2:$E$3"
        .ShowError = True
    End With
    
    MsgBox "Alle dropdowns er initialiseret!", vbInformation
End Sub


' -----------------------------------------------------------------------------
' OPRET PIVOT-RAPPORT FOR OPGAVER
' -----------------------------------------------------------------------------

Sub OpretOpgavePivot()
    ' Implementering af pivot-tabel for opgaver pr. status/tekniker
    MsgBox "Denne funktion opretter en pivot-rapport for opgaver." & vbCrLf & _
           "Du kan lave dette manuelt via Indsæt → Pivottabel.", vbInformation
End Sub


