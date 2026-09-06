# Transfer Review and Security PIN Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan review modal dan security PIN 6 digit yang diverifikasi backend sebelum transfer diproses.

**Architecture:** Backend menyimpan hash PIN nullable pada `users`, mengekspos hanya status `has_security_pin`, menyediakan endpoint setup PIN, dan memverifikasi PIN di `POST /api/transfer` sebelum `WalletService` dipanggil. Frontend memecah alur submit transfer menjadi setup PIN bila perlu, review detail, lalu konfirmasi PIN dalam komponen modal yang terisolasi.

**Tech Stack:** Laravel/Pest/PHPUnit, Eloquent, Laravel Hash, React 19, React Router, Axios, Tailwind CSS v4, Storybook, oxlint.

---

## File map

### Backend

- Create: `miniwallet-be/database/migrations/2026_09_06_000500_add_security_pin_to_users_table.php` — tambahkan kolom nullable `security_pin` secara additive agar aman untuk database yang sudah berjalan.
- Modify: `miniwallet-be/app/Models/User.php` — expose property internal dan sembunyikan field hash dari serialisasi.
- Create: `miniwallet-be/app/Http/Requests/SecurityPinRequest.php` — validasi setup PIN.
- Create: `miniwallet-be/app/Http/Controllers/Api/SecurityPinController.php` — endpoint pembuatan PIN satu kali.
- Modify: `miniwallet-be/app/Http/Requests/TransferRequest.php` — validasi dan accessor `securityPin()`.
- Modify: `miniwallet-be/app/Http/Controllers/Api/WalletController.php` — verifikasi hash PIN sebelum transfer.
- Modify: `miniwallet-be/app/Http/Resources/UserResource.php` — tambahkan `has_security_pin`, tanpa mengirim hash.
- Modify: `miniwallet-be/routes/api.php` — register `POST /api/security-pin`.
- Modify: `miniwallet-be/tests/Feature/TransferTest.php` — semua fixture transfer diberi PIN dan kontrak PIN salah/benar.
- Create: `miniwallet-be/tests/Feature/SecurityPinTest.php` — kontrak setup PIN.

### Frontend

- Create: `miniwallet-fe/src/components/TransferConfirmationModal.jsx` — modal setup/review/PIN dengan props terkontrol.
- Create: `miniwallet-fe/src/components/TransferConfirmationModal.stories.jsx` — state setup, review, PIN error, loading, dan error.
- Modify: `miniwallet-fe/src/auth/AuthProvider.jsx` — expose updater untuk user setelah PIN dibuat.
- Modify: `miniwallet-fe/src/pages/user/Transfer.jsx` — ganti direct submit menjadi flow modal dan API calls.

### Documentation

- Modify: `miniwallet-fe/README.md` — jelaskan bahwa transfer memakai review dan PIN setup pertama kali.

---

### Task 1: Add the persisted PIN field and user resource status

**Files:**
- Create: `miniwallet-be/database/migrations/2026_09_06_000500_add_security_pin_to_users_table.php`
- Modify: `miniwallet-be/app/Models/User.php`
- Modify: `miniwallet-be/app/Http/Resources/UserResource.php`
- Test: `miniwallet-be/tests/Feature/SecurityPinTest.php`

- [ ] **Step 1: Write the failing resource test**

Add this test to `SecurityPinTest.php`:

```php
<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('the profile exposes only whether a security pin exists', function () {
    $withoutPin = User::factory()->create();
    $withPin = User::factory()->create([
        'security_pin' => Hash::make('123456'),
    ]);

    $this->actingAs($withoutPin)
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('user.has_security_pin', false)
        ->assertJsonMissingPath('user.security_pin');

    $this->actingAs($withPin)
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('user.has_security_pin', true)
        ->assertJsonMissingPath('user.security_pin');
});
```

- [ ] **Step 2: Run the test and verify it fails for the missing field**

Run from `miniwallet-be`:

```bash
php artisan test tests/Feature/SecurityPinTest.php --filter="profile exposes only"
```

Expected: FAIL because `user.has_security_pin` is absent and the users table has no `security_pin` column.

- [ ] **Step 3: Add the schema, model metadata, and resource status**

Create `2026_09_06_000500_add_security_pin_to_users_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('security_pin')->nullable()->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('security_pin');
        });
    }
};
```

Update the `User` model PHPDoc and hidden attribute:

```php
@property string|null $security_pin
```

```php
#[Hidden(['password', 'remember_token', 'security_pin'])]
```

Update `UserResource::toArray()`:

```php
'has_security_pin' => $this->security_pin !== null,
```

- [ ] **Step 4: Run the focused test and the auth resource tests**

Run:

```bash
php artisan test tests/Feature/SecurityPinTest.php tests/Feature/AuthTest.php
```

Expected: PASS.

- [ ] **Step 5: Commit the schema and resource contract**

```bash
git add database/migrations/2026_09_06_000500_add_security_pin_to_users_table.php app/Models/User.php app/Http/Resources/UserResource.php tests/Feature/SecurityPinTest.php
git commit -m "feat: expose security pin status"
```

---

### Task 2: Implement first-time PIN creation

**Files:**
- Create: `miniwallet-be/app/Http/Requests/SecurityPinRequest.php`
- Create: `miniwallet-be/app/Http/Controllers/Api/SecurityPinController.php`
- Modify: `miniwallet-be/routes/api.php`
- Test: `miniwallet-be/tests/Feature/SecurityPinTest.php`

- [ ] **Step 1: Write failing endpoint tests**

Append these tests:

```php
test('a user can create a six digit security pin once', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/security-pin', [
            'pin' => '123456',
            'pin_confirmation' => '123456',
        ])
        ->assertCreated()
        ->assertJsonPath('message', 'Security PIN berhasil dibuat.');

    expect(Hash::check('123456', $user->fresh()->security_pin))->toBeTrue();
});

test('security pin setup rejects malformed or mismatched pins', function (array $payload, string $field) {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/security-pin', $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors($field);
})->with([
    'too short' => [['pin' => '12345', 'pin_confirmation' => '12345'], 'pin'],
    'non numeric' => [['pin' => '12a456', 'pin_confirmation' => '12a456'], 'pin'],
    'mismatched' => [['pin' => '123456', 'pin_confirmation' => '654321'], 'pin'],
]);

test('security pin cannot be overwritten once created', function () {
    $user = User::factory()->create(['security_pin' => Hash::make('123456')]);

    $this->actingAs($user)
        ->postJson('/api/security-pin', [
            'pin' => '654321',
            'pin_confirmation' => '654321',
        ])
        ->assertStatus(409)
        ->assertJsonPath('code', 'security_pin_exists');

    expect(Hash::check('123456', $user->fresh()->security_pin))->toBeTrue();
});
```

- [ ] **Step 2: Run the tests and verify they fail**

```bash
php artisan test tests/Feature/SecurityPinTest.php --filter="security pin"
```

Expected: FAIL because the route and controller do not exist.

- [ ] **Step 3: Implement the request validator**

Create `SecurityPinRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SecurityPinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pin' => ['bail', 'required', 'digits:6', 'numeric', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'pin.required' => 'Security PIN wajib diisi.',
            'pin.digits' => 'Security PIN harus terdiri dari 6 digit.',
            'pin.numeric' => 'Security PIN hanya boleh berisi angka.',
            'pin.confirmed' => 'Konfirmasi Security PIN tidak cocok.',
        ];
    }
}
```

- [ ] **Step 4: Implement the controller and route**

Create `SecurityPinController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SecurityPinRequest;
use Illuminate\Http\JsonResponse;

use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class SecurityPinController extends Controller
{
    public function store(SecurityPinRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->security_pin !== null) {
            return response()->json([
                'message' => 'Security PIN sudah dibuat.',
                'code' => 'security_pin_exists',
            ], Response::HTTP_CONFLICT);
        }

        $user->forceFill([
            'security_pin' => Hash::make($request->string('pin')->toString()),
        ])->save();

        return response()->json([
            'message' => 'Security PIN berhasil dibuat.',
        ], Response::HTTP_CREATED);
    }
}
```

Register in `routes/api.php` inside the authenticated active-user group, before `/transfer`:

```php
Route::post('/security-pin', [SecurityPinController::class, 'store']);
```

Add the import:

```php
use App\Http\Controllers\Api\SecurityPinController;
```

- [ ] **Step 5: Run the endpoint tests**

```bash
php artisan test tests/Feature/SecurityPinTest.php
```

Expected: PASS.

- [ ] **Step 6: Commit PIN setup**

```bash
git add app/Http/Requests/SecurityPinRequest.php app/Http/Controllers/Api/SecurityPinController.php routes/api.php tests/Feature/SecurityPinTest.php
git commit -m "feat: add security pin setup endpoint"
```

---

### Task 3: Require and verify PIN during transfer

**Files:**
- Modify: `miniwallet-be/app/Http/Requests/TransferRequest.php`
- Modify: `miniwallet-be/app/Http/Controllers/Api/WalletController.php`
- Modify: `miniwallet-be/tests/Feature/TransferTest.php`

- [ ] **Step 1: Update transfer fixtures and write failing PIN tests**

Add `use Illuminate\Support\Facades\Hash;` to `TransferTest.php`, then define:

```php
test('a transfer requires the sender security pin', function () {
    $sender = User::factory()->withWallet(100_000)->create();
    User::factory()->withWallet()->create(['email' => 'penerima@example.com']);

    $this->actingAs($sender)
        ->postJson('/api/transfer', [
            'recipient' => 'penerima@example.com',
            'amount' => 30_000,
        ])
        ->assertStatus(403)
        ->assertJsonPath('code', 'security_pin_required');
});

test('a transfer rejects an incorrect security pin without moving money', function () {
    $sender = User::factory()->withWallet(100_000)->create([
        'security_pin' => Hash::make('123456'),
    ]);
    User::factory()->withWallet()->create(['email' => 'penerima@example.com']);

    $this->actingAs($sender)
        ->postJson('/api/transfer', [
            'recipient' => 'penerima@example.com',
            'amount' => 30_000,
            'security_pin' => '654321',
        ])
        ->assertStatus(403)
        ->assertJsonPath('code', 'security_pin_invalid');

    expect($sender->fresh()->wallet->balance)->toBe(100_000);
    $this->assertDatabaseCount('transactions', 0);
});
```

Update every existing successful/boundary transfer request in `TransferTest.php` with:

```php
'security_pin' => '123456',
```

and update the corresponding user factory to include:

```php
'security_pin' => Hash::make('123456'),
```

This keeps existing transfer behavior under the new authentication contract instead of bypassing the feature in tests.

- [ ] **Step 2: Run transfer tests and verify the new tests fail**

```bash
php artisan test tests/Feature/TransferTest.php
```

Expected: the new tests fail because `security_pin` is not yet accepted or checked, while existing tests may fail until fixtures are updated.

- [ ] **Step 3: Add request validation and accessor**

Add to `TransferRequest::rules()`:

```php
'security_pin' => ['bail', 'required', 'digits:6', 'numeric'],
```

Add to `TransferRequest`:

```php
public function securityPin(): string
{
    return $this->string('security_pin')->toString();
}
```

- [ ] **Step 4: Verify the PIN before calling the wallet service**

Import `Hash` in `WalletController.php`, then at the start of `transfer()` after resolving `$sender`:

```php
if ($sender->security_pin === null) {
    return response()->json([
        'message' => 'Buat Security PIN terlebih dahulu.',
        'code' => 'security_pin_required',
    ], 403);
}

if (! Hash::check($request->securityPin(), $sender->security_pin)) {
    return response()->json([
        'message' => 'Security PIN salah.',
        'code' => 'security_pin_invalid',
    ], 403);
}
```

Place this before recipient lookup so an invalid PIN cannot reveal recipient existence. Keep the existing `WalletService::transfer()` call and database transaction unchanged.

- [ ] **Step 5: Run all backend feature tests**

```bash
php artisan test
```

Expected: PASS, including setup, transfer, auth, top-up, history, and admin tests.

- [ ] **Step 6: Commit transfer PIN verification**

```bash
git add app/Http/Requests/TransferRequest.php app/Http/Controllers/Api/WalletController.php tests/Feature/TransferTest.php
git commit -m "feat: require pin for transfers"
```

---

### Task 4: Build the reusable transfer confirmation modal

**Files:**
- Create: `miniwallet-fe/src/components/TransferConfirmationModal.jsx`
- Create: `miniwallet-fe/src/components/TransferConfirmationModal.stories.jsx`

- [ ] **Step 1: Create the modal contract and presentation states**

Implement a controlled component with these props:

```js
{
  open,
  mode, // 'setup' | 'review' | 'pin'
  recipient,
  amount,
  balanceAfter,
  pin,
  pinConfirmation,
  error,
  submitting,
  onPinChange,
  onPinConfirmationChange,
  onBack,
  onReview,
  onSubmit,
  onClose,
}
```

Use a semantic dialog shell:

```jsx
{open && (
  <div className="fixed inset-0 z-50 grid place-items-end bg-forest-900/55 p-4 lg:place-items-center">
    <div role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title" className="w-full max-w-md rounded-sheet bg-paper p-6 shadow-lift">
      {/* mode-specific content */}
    </div>
  </div>
)}
```

Setup mode must render two six-digit numeric/password inputs and `Simpan PIN`. Review mode must render recipient, `formatRupiah(amount)`, `formatRupiah(balanceAfter)`, `Kembali`, and `Konfirmasi & Kirim`; that last action calls `onReview` and does not call the transfer API. PIN mode must render one six-digit input and `Konfirmasi`, with inline `error` and disabled submit while `submitting`.

Do not store PIN internally in this component; all values remain controlled by `Transfer.jsx`.

- [ ] **Step 2: Add Storybook stories for every required visual state**

Create stories covering:

```jsx
export const Setup = { args: { open: true, mode: 'setup' } }
export const Review = {
  args: {
    open: true,
    mode: 'review',
    recipient: 'Budi Santoso · budi@example.com',
    amount: 30000,
    balanceAfter: 170000,
  },
}
export const PinError = {
  args: { open: true, mode: 'pin', error: 'Security PIN salah.' },
}
export const Loading = {
  args: { open: true, mode: 'pin', submitting: true, pin: '123456' },
}
```

Add Storybook action handlers for every callback so stories render without API calls.

- [ ] **Step 3: Run Storybook build and lint**

From `miniwallet-fe`:

```bash
npm run build-storybook
npm run lint
```

Expected: both commands pass with all modal stories included.

- [ ] **Step 4: Commit the modal component**

```bash
git add src/components/TransferConfirmationModal.jsx src/components/TransferConfirmationModal.stories.jsx
git commit -m "feat: add transfer confirmation modal"
```

---

### Task 5: Wire authentication status and transfer flow into the page

**Files:**
- Modify: `miniwallet-fe/src/auth/AuthProvider.jsx`
- Modify: `miniwallet-fe/src/pages/user/Transfer.jsx`

- [ ] **Step 1: Add a user updater to AuthProvider**

Add a stable callback:

```jsx
const updateUser = useCallback((changes) => {
  setUser((current) => (current ? { ...current, ...changes } : current))
}, [])
```

Expose it in the memoized context value and dependency list:

```jsx
updateUser,
```

This lets the transfer page mark `has_security_pin: true` after a successful setup without storing the PIN itself.

- [ ] **Step 2: Refactor `Transfer.jsx` submit state before changing API behavior**

Import `useAuth` and the modal:

```jsx
import { useAuth } from '../../auth/useAuth.js'
import { TransferConfirmationModal } from '../../components/TransferConfirmationModal.jsx'
```

Add state:

```jsx
const { user, updateUser } = useAuth()
const [modalMode, setModalMode] = useState(null)
const [pin, setPin] = useState('')
const [pinConfirmation, setPinConfirmation] = useState('')
const [modalError, setModalError] = useState('')
```

Change `handleSubmit` so it only validates the current form, clears modal errors, and opens the next mode:

```jsx
function handleSubmit(event) {
  event.preventDefault()
  if (submitting || !canSubmit) return
  setModalError('')
  setModalMode(user?.has_security_pin ? 'review' : 'setup')
}
```

The existing form `onSubmit` remains intact; it no longer calls `/transfer`.

- [ ] **Step 3: Implement setup, review, and PIN handlers**

Add these handlers to `Transfer.jsx`:

```jsx
async function handlePinSetup(event) {
  event.preventDefault()
  if (pin.length !== 6 || pin !== pinConfirmation) {
    setModalError(
      pin.length !== 6
        ? 'Security PIN harus terdiri dari 6 digit.'
        : 'Konfirmasi Security PIN tidak cocok.',
    )
    return
  }

  setSubmitting(true)
  setModalError('')

  try {
    await api.post('/security-pin', { pin, pin_confirmation: pinConfirmation })
    updateUser({ has_security_pin: true })
    setPin('')
    setPinConfirmation('')
    setModalMode('review')
  } catch (error) {
    setModalError(error.message)
  } finally {
    setSubmitting(false)
  }
}

async function handleTransferConfirmation(event) {
  event.preventDefault()
  if (submitting || pin.length !== 6) return

  setSubmitting(true)
  setModalError('')

  try {
    await api.post('/transfer', {
      recipient: recipient.trim(),
      amount: Number(amount),
      description: description.trim() || undefined,
      security_pin: pin,
    })

    navigate('/dashboard', {
      replace: true,
      state: { flash: `Transfer ${formatRupiah(Number(amount))} berhasil dikirim.` },
    })
  } catch (error) {
    setModalError(error.message)
    setSubmitting(false)
  }
}

function closeModal() {
  if (submitting) return
  setModalMode(null)
  setPin('')
  setPinConfirmation('')
  setModalError('')
}
```

- [ ] **Step 4: Render the modal and derive review values**

Derive the post-transfer balance and display recipient label:

```jsx
const balanceAfter = Number(balance ?? 0) - Number(amount || 0)
const recipientLabel = pickedContact
  ? `${pickedContact.name} · ${pickedContact.transfer_target}`
  : recipient.trim()
```

Render after the form:

```jsx
function openPinConfirmation() {
  setPin('')
  setModalError('')
  setModalMode('pin')
}

<TransferConfirmationModal
  open={modalMode !== null}
  mode={modalMode}
  recipient={recipientLabel}
  amount={Number(amount || 0)}
  balanceAfter={balanceAfter}
  pin={pin}
  pinConfirmation={pinConfirmation}
  error={modalError}
  submitting={submitting}
  onPinChange={setPin}
  onPinConfirmationChange={setPinConfirmation}
  onBack={() => setModalMode(modalMode === 'pin' ? 'review' : null)}
  onReview={openPinConfirmation}
  onSubmit={modalMode === 'setup' ? handlePinSetup : handleTransferConfirmation}
  onClose={closeModal}
/>
```

The modal's review action must advance to `pin`, and its back action must never clear the transfer form. Keep the existing server error banner for errors that occur before the modal flow; modal errors belong inside the dialog.

- [ ] **Step 5: Build and lint the frontend**

From `miniwallet-fe`:

```bash
npm run lint
npm run build
```

Expected: PASS with no unused imports or JSX errors.

- [ ] **Step 6: Commit the wired transfer flow**

```bash
git add src/auth/AuthProvider.jsx src/pages/user/Transfer.jsx
git commit -m "feat: review transfers before sending"
```

---

### Task 6: Update docs and perform full verification

**Files:**
- Modify: `miniwallet-fe/README.md`

- [ ] **Step 1: Document the user flow**

Add under the transfer page documentation:

```md
### Review transfer dan Security PIN

Menekan `Lanjutkan` membuka review transfer sebelum request dikirim. Pada transfer pertama, pengguna diminta membuat Security PIN 6 digit. PIN disimpan sebagai hash di backend dan diminta kembali saat konfirmasi transfer; PIN tidak disimpan di browser.
```

- [ ] **Step 2: Run backend formatting and static checks**

From `miniwallet-be`:

```bash
vendor/bin/pint --test
php artisan test
```

Expected: Pint reports no formatting changes and all Pest tests pass.

- [ ] **Step 3: Run frontend checks**

From `miniwallet-fe`:

```bash
npm run lint
npm run build
npm run build-storybook
```

Expected: all commands exit successfully.

- [ ] **Step 4: Inspect the final diff for secrets and accidental root changes**

From repository root:

```bash
git --no-pager diff HEAD~5 --check
git --no-pager status --short
```

Expected: no whitespace errors; only the intended feature files plus the pre-existing deleted root `package.json` and `package-lock.json` are present. Confirm no plaintext PIN, token, or generated build output was added.

- [ ] **Step 5: Commit documentation**

```bash
git add miniwallet-fe/README.md
git commit -m "docs: explain transfer pin flow"
```
