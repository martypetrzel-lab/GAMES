import { addToWishlist } from "@/modules/accounts/wishlist-actions";

export function WishlistButton({
  externalGameId,
  returnTo,
}: {
  externalGameId: string;
  returnTo: string;
}) {
  return (
    <form action={addToWishlist}>
      <input type="hidden" name="externalGameId" value={externalGameId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button className="wishlist-button">♡ Přidat do seznamu přání</button>
    </form>
  );
}
