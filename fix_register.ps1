$filePath = "c:/Users/design1saohan/Downloads/vsaps2026-main (2)/vsaps2026-main/src/views/PublicDelegateRegister.tsx"
$lines = Get-Content $filePath -Encoding UTF8

# Lines are 0-indexed in array, 1-indexed in file
# Line 537 (index 536) is corrupted - should be: console.error('Failed to send notifications:', err);
# Then lines 538-795 (indices 537-794) contain the new success screen code - BUT they're valid code just wrongly indented
# Lines 796-821 (indices 795-820) are corrupt orphaned fragments

# The fix:
# 1. Replace line 537 (index 536) with proper console.error close + the correct start of the success block
# 2. Remove lines 796-821 (indices 795-820)

# Build the replacement for line 537 (index 536)
# The correct code should be: close the catch, close the try block, then set state and close the function

$fixedLine537 = "        console.error('Failed to send notifications:', err);"

# Lines 538-795 (indices 537-794) contain valid new success screen code that should stay
# Lines 796-821 (indices 795-820) are orphaned fragments that should be removed

# Reconstruct:
# Part 1: lines 1-537 (indices 0-536), but fix line 537 (index 536)
$part1 = $lines[0..535]  # Lines 1-536 (original, clean)
$part1 += $fixedLine537   # Fixed line 537

# Part 2: lines 538-795 (indices 537-794) - the valid success screen code
$part2 = $lines[537..794]

# Part 3: lines 822+ (index 821+) - the clean remaining code
$part3 = $lines[821..($lines.Count - 1)]

# We also need to fix line 795 which is ");" and close the } of the if(isSubmitted) block
# Check what line 795 (index 794) says - it should be ");" and we need to add "}"
Write-Output "Line 794 (0-indexed): $($lines[793])"
Write-Output "Line 795 (0-indexed): $($lines[794])"
Write-Output "Line 796 (0-indexed): $($lines[795])"

$combined = $part1 + $part2 + $part3
Write-Output "Combined line count: $($combined.Count)"
