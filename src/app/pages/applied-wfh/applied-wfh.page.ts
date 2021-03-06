import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {DatePipe} from '@angular/common';
import {Router} from '@angular/router';

import {select, Store} from '@ngrx/store';

import {ActionSheetController} from '@ionic/angular';

import {ApiService} from '../../core/providers/api.service';
import {AlertService} from '../../core/providers/alert.service';
import {WorkFromHome} from '../../core/models/http/responses/wfh-list.response';
import * as appStore from '../../store/reducers';
import {selectsWFHListLoader, selectWFHListState} from '../../store/wfh/selectors/wfh.selectors';
import {loadWFHs} from '../../store/wfh/actions/wfh.actions';
import * as WfhRecordResponse from '../../core/models/http/responses/wfh-record.response';

@Component({
  selector: 'app-applied-wfh',
  templateUrl: './applied-wfh.page.html',
  styleUrls: ['./applied-wfh.page.scss'],
})
export class AppliedWfhPage implements OnInit, OnDestroy {

  // @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;

  appliedWFHList$: Observable<WorkFromHome[]> = of([]);
  pageNo = 1;
  actions = [{
    text: 'Delete',
    role: 'destructive',
    icon: 'trash',
    handler: () => {
      this.removeAppliedWFH();
    }
  }, {
    text: 'Cancel',
    icon: 'close',
    role: 'cancel',
    handler: () => {
      this.selectedWFH = null;
    }
  }];
  updateAction = {
    text: 'Update',
    icon: 'create-outline',
    role: 'update',
    handler: () => {
      this.updateAppliedWFH();
    }
  };
  selectedWFH: WfhRecordResponse.Result;
  totalWFH: number;
  isRefreshing = false;
  wfhListLoading$;

  private unSubscribe = new Subject();
  selectedMonth = 'this month';


  constructor(
    private api: ApiService,
    private alertService: AlertService,
    private store: Store<appStore.State>,
    public actionSheetController: ActionSheetController,
    private datePipe: DatePipe,
    private router: Router,
  ) {
  }

  ngOnInit() {
    this.wfhListLoading$ = this.store.pipe(select(selectsWFHListLoader))
    this.loadAppliedWFH();
  }

  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  loadAppliedWFH() {
    this.appliedWFHList$ = this.store.pipe(select(selectWFHListState));
  }

  refresh(event) {
    this.isRefreshing = true;
    this.reload();
    setTimeout(() => {
      this.isRefreshing = false;
      event.target.complete();
    }, 500);
  }

  async presentActionSheet(selectedWFH: WorkFromHome) {

    const actions = this.isWFHAppliedToday(selectedWFH) ? [...this.actions, this.updateAction] : this.actions;
    const actionSheet = await this.actionSheetController.create({
      header: 'WFH',
      cssClass: 'my-custom-class',
      buttons: actions
    });
    this.selectedWFH = selectedWFH;
    await actionSheet.present();

  }

  selectMonth(thisMonth: string) {
    this.selectedMonth = thisMonth;
    if (thisMonth === 'this month') {
      this.store.dispatch(loadWFHs({pageNo: 1, thisMonth: true, lastMonth: false }));
    } else if (thisMonth === 'prev month') {
      this.store.dispatch(loadWFHs({pageNo: 1, thisMonth: false, lastMonth: true}));
    }
  }

  loadMore(event) {
    // if (this.totalWFH && this.pageNo > (this.totalWFH / 10)) {
    //   this.infiniteScroll.disabled = true;
    //   return;
    // }
    // this.pageNo += 1;
    // this.store.dispatch(loadWFHs({pageNo: this.pageNo, thisMonth: true}));
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  private isWFHAppliedToday(selectedWFH: WorkFromHome): boolean {
    const today = this.datePipe.transform(new Date(), 'dd/MM/yyyy');
    const wfhDate = this.datePipe.transform(selectedWFH?.date, 'dd/MM/yyyy');
    return wfhDate === today;
  }

  private updateAppliedWFH() {
    if (!this.selectedWFH) {
      return;
    }
    this.api.getAppliedWFH(this.selectedWFH?.id).subscribe((res) => {
      if (res?.success) {
        this.selectedWFH = null;
        if (!res.result) {
          this.alertService.toastAlert(res?.message, 'Error');
          return;
        }
        this.router.navigateByUrl('/tabs/wfh', {
          state: {data: res?.result}
        });
      }
    });
  }

  private removeAppliedWFH() {
    if (!this.selectedWFH) {
      return;
    }
    this.api.deleteAppliedWFH(this.selectedWFH?.id).subscribe((res) => {
      if (res?.success) {
        this.selectedWFH = null;
        this.alertService.toastAlert(res?.message, 'Info');
        this.reload();
      }
    });
  }

  private reload() {
    this.store.dispatch(loadWFHs({pageNo: 1, thisMonth: true}));
    // this.infiniteScroll.disabled = false;
  }

}
